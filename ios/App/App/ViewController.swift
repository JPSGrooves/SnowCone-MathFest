//
//  ViewController.swift
//  App
//
//  Created by Jeremy Smith on 12/4/25.
//

import UIKit
import Capacitor
import WebKit   // WKWebView / evaluateJavaScript / message handlers
import GameKit  // 🎮 Game Center

class ViewController: CAPBridgeViewController, WKScriptMessageHandler {

    // MARK: - Game Center state

    private var gcAuthInProgress = false
    private var gcQueuedActions: [() -> Void] = []

    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()
        print("🍧🍧🍧 [SCMF] ViewController.viewDidLoad – native shell is LIVE 🍧🍧🍧")

        // ✅ IMPORTANT:
        // Register the JS -> native bridge your web bundle already tries to call:
        // window.webkit.messageHandlers.gameCenterBridge.postMessage(...)
        registerGameCenterBridgeHandler()

        // First chance to tell the web app it's running inside native iOS shell
        injectIOSNativeFlag()
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)

        // Second chance – in case the webView was recreated or attached later
        print("🔁 [SCMF] ViewController.viewDidAppear – reinjecting SC_IOS_NATIVE just in case")
        injectIOSNativeFlag()
    }

    deinit {
        // Prevent duplicate handler warnings if VC ever deallocs/reloads
        if let webView = self.webView {
            webView.configuration.userContentController.removeScriptMessageHandler(forName: "gameCenterBridge")
        }
    }

    // MARK: - Game Center Bridge Registration

    private func registerGameCenterBridgeHandler() {
        // Use async so Capacitor fully wires up webView first
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let webView = self.webView else {
                print("⚠️ [SCMF][GC] webView is nil – cannot register gameCenterBridge yet.")
                return
            }

            // If we re-register multiple times, WebKit can complain.
            // So we remove first, then add fresh.
            webView.configuration.userContentController.removeScriptMessageHandler(forName: "gameCenterBridge")
            webView.configuration.userContentController.add(self, name: "gameCenterBridge")

            print("✅ [SCMF][GC] Registered WKScriptMessageHandler: gameCenterBridge")
        }
    }

    // MARK: - WKScriptMessageHandler

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "gameCenterBridge" else { return }

        // message.body might be a dictionary OR a JSON string (depending on sender)
        if let dict = message.body as? [String: Any] {
            handleGameCenterPayload(dict)
            return
        }

        if let str = message.body as? String,
           let data = str.data(using: .utf8),
           let obj = try? JSONSerialization.jsonObject(with: data, options: []),
           let dict = obj as? [String: Any] {
            handleGameCenterPayload(dict)
            return
        }

        print("🍧⚠️ [SCMF][GC] Unhandled message.body type: \(type(of: message.body))")
    }

    // MARK: - Payload Router

    private func handleGameCenterPayload(_ payload: [String: Any]) {
        let type = (payload["type"] as? String) ?? ""
        print("🍧📨 [SCMF][GC] payload:", payload)

        switch type {
        case "leaderboard":
            let boardId = payload["boardId"] as? String
            let value = coerceInt(payload["value"])

            guard let boardId, !boardId.isEmpty, value > 0 else {
                print("🍧⚠️ [SCMF][GC] leaderboard payload missing boardId/value")
                return
            }

            ensureGameCenterAuthenticated { [weak self] in
                self?.submitLeaderboardScore(boardId: boardId, value: value)
            }

        case "achievement":
            let achievementId = payload["achievementId"] as? String
            let percent = coerceDouble(payload["percent"])
            let clamped = max(0.0, min(100.0, percent))

            guard let achievementId, !achievementId.isEmpty else {
                print("🍧⚠️ [SCMF][GC] achievement payload missing achievementId")
                return
            }

            ensureGameCenterAuthenticated { [weak self] in
                self?.submitAchievement(achievementId: achievementId, percent: clamped)
            }

        default:
            print("🍧⚠️ [SCMF][GC] Unknown payload type:", type)
        }
    }

    // MARK: - Game Center Auth

    private func ensureGameCenterAuthenticated(_ action: @escaping () -> Void) {
        // If already authed, run immediately
        if GKLocalPlayer.local.isAuthenticated {
            action()
            return
        }

        // Queue the action until auth completes
        gcQueuedActions.append(action)

        // If auth already happening, chill
        if gcAuthInProgress { return }
        gcAuthInProgress = true

        let player = GKLocalPlayer.local

        player.authenticateHandler = { [weak self] vc, error in
            guard let self = self else { return }

            if let error = error {
                print("🍧❌ [SCMF][GC] auth error:", error.localizedDescription)
                self.gcAuthInProgress = false
                self.gcQueuedActions.removeAll()
                return
            }

            if let vc = vc {
                // Present Apple’s login UI
                DispatchQueue.main.async {
                    self.present(vc, animated: true)
                }
                return
            }

            // No VC means auth finished
            self.gcAuthInProgress = false

            if GKLocalPlayer.local.isAuthenticated {
                print("🍧✅ [SCMF][GC] authenticated as:", GKLocalPlayer.local.alias)

                // Flush queued actions
                let actions = self.gcQueuedActions
                self.gcQueuedActions = []
                actions.forEach { $0() }
            } else {
                print("🍧⚠️ [SCMF][GC] not authenticated (user may have canceled)")
                self.gcQueuedActions.removeAll()
            }
        }
    }

    // MARK: - Submitters

    private func submitAchievement(achievementId: String, percent: Double) {
        guard GKLocalPlayer.local.isAuthenticated else {
            print("🍧⚠️ [SCMF][GC] submitAchievement called while not authed")
            return
        }

        let ach = GKAchievement(identifier: achievementId)
        ach.percentComplete = percent
        ach.showsCompletionBanner = (percent >= 100.0)

        GKAchievement.report([ach]) { error in
            if let error = error {
                print("🍧❌ [SCMF][GC] achievement report failed:", error.localizedDescription, "id:", achievementId)
            } else {
                print("🍧🏅 [SCMF][GC] achievement reported:", achievementId, "percent:", percent)
            }
        }
    }

    private func submitLeaderboardScore(boardId: String, value: Int) {
        guard GKLocalPlayer.local.isAuthenticated else {
            print("🍧⚠️ [SCMF][GC] submitLeaderboardScore called while not authed")
            return
        }

        if #available(iOS 14.0, *) {
            GKLeaderboard.submitScore(
                value,
                context: 0,
                player: GKLocalPlayer.local,
                leaderboardIDs: [boardId]
            ) { error in
                if let error = error {
                    print("🍧❌ [SCMF][GC] leaderboard submit failed:", error.localizedDescription, "board:", boardId)
                } else {
                    print("🍧🏆 [SCMF][GC] leaderboard submitted:", boardId, "value:", value)
                }
            }
        } else {
            let score = GKScore(leaderboardIdentifier: boardId)
            score.value = Int64(value)
            GKScore.report([score]) { error in
                if let error = error {
                    print("🍧❌ [SCMF][GC] leaderboard submit (legacy) failed:", error.localizedDescription, "board:", boardId)
                } else {
                    print("🍧🏆 [SCMF][GC] leaderboard submitted (legacy):", boardId, "value:", value)
                }
            }
        }
    }

    // MARK: - Coercion helpers (handles number/string payloads cleanly)

    private func coerceInt(_ any: Any?) -> Int {
        if let n = any as? Int { return n }
        if let n = any as? Double { return Int(n) }
        if let n = any as? Float { return Int(n) }
        if let s = any as? String, let n = Int(s) { return n }
        return 0
    }

    private func coerceDouble(_ any: Any?) -> Double {
        if let n = any as? Double { return n }
        if let n = any as? Int { return Double(n) }
        if let n = any as? Float { return Double(n) }
        if let s = any as? String, let n = Double(s) { return n }
        return 0.0
    }

    // MARK: - SC_IOS_NATIVE flag injector

    private func injectIOSNativeFlag() {
        // Use async so we hit the webView after Capacitor fully wires it up
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let webView = self.webView else {
                print("⚠️ [SCMF] webView is nil – cannot inject SC_IOS_NATIVE yet.")
                return
            }

            print("🔮 [SCMF] About to inject SC_IOS_NATIVE into webView…")

            let js = "window.SC_IOS_NATIVE = true;"
            webView.evaluateJavaScript(js) { _, error in
                if let error = error {
                    print("⚠️ [SCMF] Failed to set SC_IOS_NATIVE: \(error)")
                } else {
                    print("✅ [SCMF] SC_IOS_NATIVE flag set to true")
                }
            }
        }
    }

    // MARK: - Layout (safe-area pinning)

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()

        // Grab Capacitor’s web view
        guard let webView = self.webView else {
            print("⚠️ [SCMF] webView is nil – cannot layout SnowCone shell.")
            return
        }

        // We’re taking control of its layout
        webView.translatesAutoresizingMaskIntoConstraints = false

        // Nuke any old constraints that might fight ours
        NSLayoutConstraint.deactivate(webView.constraints)

        // 📐 Pin the webview exactly to the safe area
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor)
        ])
    }
}
