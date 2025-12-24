//
//  ViewController.swift
//  App
//
//  Created by Jeremy Smith on 12/4/25.
//

import UIKit
import Capacitor
import WebKit
import GameKit
import AVFoundation

final class ViewController: CAPBridgeViewController, WKScriptMessageHandler {

    // MARK: - Game Center state

    private var gcAuthInProgress = false
    private var gcQueuedActions: [() -> Void] = []

    // MARK: - Layout constraints

    private var webViewPinned = false
    private var webViewPinConstraints: [NSLayoutConstraint] = []

    // MARK: - Constants

    private let handlerName = "gameCenterBridge"

    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()
        print("🍧🍧🍧 [SCMF] ViewController.viewDidLoad – native shell is LIVE 🍧🍧🍧")

        // ✅ Optional: make iOS audio behavior intentional.
        // - .ambient / .soloAmbient  => RESPECTS the silent switch (muted when phone is on silent)
        // - .playback               => IGNORES silent switch (always plays if your app volume isn't muted)
        //
        // If you think "ambient might be fucking us", that usually means:
        // your phone is on silent, so audio correctly doesn't play.
        configureAudioSession(category: .playback)

        // ✅ Inject the native flag EARLY (document start) so platform.js can see it reliably.
        installNativeFlagUserScript()

        // ✅ Register JS -> native bridge.
        registerGameCenterBridgeHandler()
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)

        // A second "belt + suspenders" injection in case the webView reloads.
        injectIOSNativeFlagOnceLoaded()
    }

    deinit {
        if let webView = self.webView {
            webView.configuration.userContentController.removeScriptMessageHandler(forName: handlerName)
        }
    }

    // MARK: - Audio Session

    private func configureAudioSession(category: AVAudioSession.Category) {
        do {
            let session = AVAudioSession.sharedInstance()

            // mixWithOthers keeps background music from other apps if user wants that vibe.
            // Remove it if you want SCMF to take full control.
            try session.setCategory(category, options: [.mixWithOthers])
            try session.setActive(true)

            print("🔊 [SCMF] AVAudioSession category:", category.rawValue)
        } catch {
            print("⚠️ [SCMF] AVAudioSession setup failed:", error.localizedDescription)
        }
    }

    // MARK: - Native Flag Injection (EARLY)

    private func installNativeFlagUserScript() {
        guard let webView = self.webView else {
            print("⚠️ [SCMF] webView is nil – cannot install native flag user script yet.")
            return
        }

        // Remove any prior scripts if hot-reloaded
        let uc = webView.configuration.userContentController
        uc.removeAllUserScripts()

        let js = """
        (function(){
          try {
            window.SC_IOS_NATIVE = true;
          } catch(e) {}
        })();
        """

        let script = WKUserScript(source: js, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        uc.addUserScript(script)

        print("✅ [SCMF] Installed WKUserScript: SC_IOS_NATIVE=true (document start)")
    }

    // MARK: - Native Flag Injection (Backup)

    private func injectIOSNativeFlagOnceLoaded() {
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let webView = self.webView else {
                print("⚠️ [SCMF] webView is nil – cannot inject SC_IOS_NATIVE yet.")
                return
            }

            let js = "window.SC_IOS_NATIVE = true;"
            webView.evaluateJavaScript(js) { _, error in
                if let error = error {
                    print("⚠️ [SCMF] Failed to set SC_IOS_NATIVE:", error.localizedDescription)
                } else {
                    print("✅ [SCMF] SC_IOS_NATIVE flag set (backup)")
                }
            }
        }
    }

    // MARK: - Game Center Bridge Registration

    private func registerGameCenterBridgeHandler() {
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let webView = self.webView else {
                print("⚠️ [SCMF][GC] webView is nil – cannot register \(self?.handlerName ?? "handler") yet.")
                return
            }

            let uc = webView.configuration.userContentController
            uc.removeScriptMessageHandler(forName: self.handlerName)
            uc.add(self, name: self.handlerName)

            print("✅ [SCMF][GC] Registered WKScriptMessageHandler:", self.handlerName)
        }
    }

    // MARK: - WKScriptMessageHandler

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == handlerName else { return }

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

        print("🍧⚠️ [SCMF][GC] Unhandled message.body type:", type(of: message.body))
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
        if GKLocalPlayer.local.isAuthenticated {
            action()
            return
        }

        gcQueuedActions.append(action)

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
                DispatchQueue.main.async {
                    self.present(vc, animated: true)
                }
                return
            }

            self.gcAuthInProgress = false

            if GKLocalPlayer.local.isAuthenticated {
                print("🍧✅ [SCMF][GC] authenticated as:", GKLocalPlayer.local.alias)

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

    // MARK: - Coercion helpers

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

    // MARK: - Layout (safe-area pinning)

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        pinWebViewToSafeAreaOnce()
    }

    private func pinWebViewToSafeAreaOnce() {
        guard let webView = self.webView else {
            print("⚠️ [SCMF] webView is nil – cannot layout SnowCone shell.")
            return
        }

        // Only pin once; re-pinning every layout pass is constraint-chaos.
        if webViewPinned { return }
        webViewPinned = true

        webView.translatesAutoresizingMaskIntoConstraints = false

        // Deactivate only our own stored constraints (not random internal webView constraints)
        NSLayoutConstraint.deactivate(webViewPinConstraints)
        webViewPinConstraints.removeAll()

        webViewPinConstraints = [
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor)
        ]
        NSLayoutConstraint.activate(webViewPinConstraints)

        print("📐 [SCMF] webView pinned to safe area once ✅")
    }
}
