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

final class ViewController: CAPBridgeViewController, WKScriptMessageHandler, WKNavigationDelegate {

    // MARK: - Game Center state
    private var gcAuthInProgress = false
    private var gcQueuedActions: [() -> Void] = []

    // MARK: - Constants
    private let handlerName = "gameCenterBridge"

    // MARK: - Lifecycle observers
    private var lifecycleObserversWired = false
    private var audioObserversWired = false

    // MARK: - WebView readiness + JS event queue
    private var scmfWebReady = false
    private var scmfPendingEvents: [String] = []
    private var lastBgFgState: Bool? = nil   // true = foreground, false = background (dedupe)

    // MARK: - Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()

        print("🍧🍧🍧 [SCMF] ViewController.viewDidLoad – native shell is LIVE 🍧🍧🍧")

        // ✅ Make sure we can detect when the web app is truly ready.
        self.webView?.navigationDelegate = self

        // ✅ Silent switch behavior:
        // - .ambient / .soloAmbient => RESPECTS silent switch
        // - .playback               => IGNORES silent switch
        configureAudioSession(category: .ambient)

        // ✅ Native lifecycle -> JS event bridge
        wireNativeLifecycleBridgeOnce()

        // ✅ Audio interruption/route-change bridge
        wireAudioSessionNotificationsOnce()

        // ✅ Inject native flag EARLY
        installNativeFlagUserScript()

        // ✅ Register JS -> native bridge (Game Center)
        registerGameCenterBridgeHandler()
    }

    deinit {
        if let webView = self.webView {
            webView.configuration.userContentController.removeScriptMessageHandler(forName: handlerName)
        }
        NotificationCenter.default.removeObserver(self)
    }

    // MARK: - WKNavigationDelegate (WebView is ready)
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        scmfWebReady = true

        // Belt + suspenders: set the flag again after load
        webView.evaluateJavaScript("window.SC_IOS_NATIVE = true;") { _, _ in }

        print("⚡️  WebView loaded (didFinish) ✅")
        scmfFlushPendingEvents()
    }

    // MARK: - Audio Session
    private func configureAudioSession(category: AVAudioSession.Category) {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(category, options: [.mixWithOthers])
            try session.setActive(true)
            print("🔇 AVAudioSession set to \(category.rawValue)")
        } catch {
            print("⚠️ [SCMF] AVAudioSession setup failed:", error.localizedDescription)
        }
    }

    private func reactivateAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setActive(true)
            print("🔊 [SCMF] AVAudioSession re-activated ✅")
        } catch {
            print("⚠️ [SCMF] AVAudioSession re-activate failed:", error.localizedDescription)
        }
    }

    // MARK: - Native Lifecycle -> queued JS Events
    private func wireNativeLifecycleBridgeOnce() {
        if lifecycleObserversWired { return }
        lifecycleObserversWired = true

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(onWillResignActive),
            name: UIApplication.willResignActiveNotification,
            object: nil
        )

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(onDidBecomeActive),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(onDidEnterBackground),
            name: UIApplication.didEnterBackgroundNotification,
            object: nil
        )

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(onWillEnterForeground),
            name: UIApplication.willEnterForegroundNotification,
            object: nil
        )

        print("✅ [SCMF] Wired native lifecycle bridge (bg/fg) → JS events")
    }

    @objc private func onWillResignActive() {
        // about to background / app switch
        emitBgFg(isForeground: false, eventName: "scmf:nativeBackground")
    }

    @objc private func onDidEnterBackground() {
        // fully backgrounded
        emitBgFg(isForeground: false, eventName: "scmf:nativeBackground")
    }

    @objc private func onWillEnterForeground() {
        // coming back
        reactivateAudioSession()
        emitBgFg(isForeground: true, eventName: "scmf:nativeForeground")
    }

    @objc private func onDidBecomeActive() {
        reactivateAudioSession()
        emitBgFg(isForeground: true, eventName: "scmf:nativeForeground")
    }

    private func emitBgFg(isForeground: Bool, eventName: String) {
        // ✅ Dedupe spam (iOS can fire multiple notifications)
        if lastBgFgState == isForeground { return }
        lastBgFgState = isForeground

        scmfEmitEventToJS(eventName)
    }

    // MARK: - Audio session notifications (interruptions, route changes)
    private func wireAudioSessionNotificationsOnce() {
        if audioObserversWired { return }
        audioObserversWired = true

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleAudioInterruption(_:)),
            name: AVAudioSession.interruptionNotification,
            object: nil
        )

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleAudioRouteChange(_:)),
            name: AVAudioSession.routeChangeNotification,
            object: nil
        )

        print("✅ [SCMF] Wired AVAudioSession interruption + route change observers")
    }

    @objc private func handleAudioInterruption(_ notification: Notification) {
        guard
            let info = notification.userInfo,
            let typeValue = info[AVAudioSessionInterruptionTypeKey] as? UInt,
            let type = AVAudioSession.InterruptionType(rawValue: typeValue)
        else { return }

        switch type {
        case .began:
            print("📵 [SCMF] Audio interruption began")
            emitBgFg(isForeground: false, eventName: "scmf:nativeBackground")

        case .ended:
            print("📳 [SCMF] Audio interruption ended")
            reactivateAudioSession()
            emitBgFg(isForeground: true, eventName: "scmf:nativeForeground")

        @unknown default:
            break
        }
    }

    @objc private func handleAudioRouteChange(_ notification: Notification) {
        print("🎧 [SCMF] Audio route changed")
        reactivateAudioSession()
        emitBgFg(isForeground: true, eventName: "scmf:nativeForeground")
    }

    // MARK: - Native Flag Injection (EARLY)
    private func installNativeFlagUserScript() {
        guard let webView = self.webView else {
            print("⚠️ [SCMF] webView is nil – cannot install native flag user script yet.")
            return
        }

        let uc = webView.configuration.userContentController

        // Only remove our scripts if you later add more; for now, safe to clear
        uc.removeAllUserScripts()

        let js = """
        (function(){
          try { window.SC_IOS_NATIVE = true; } catch(e) {}
        })();
        """

        let script = WKUserScript(source: js, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        uc.addUserScript(script)

        print("✅ [SCMF] Installed WKUserScript: SC_IOS_NATIVE=true (document start)")
    }

    // MARK: - JS Event Bridge (queue until WebView is ready + app active)
    private func scmfEmitEventToJS(_ eventName: String) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            // If we're not active, queue it (WKWebView eval can fail in background)
            if UIApplication.shared.applicationState != .active {
                self.scmfPendingEvents.append(eventName)
                return
            }

            guard let webView = self.webView else {
                self.scmfPendingEvents.append(eventName)
                return
            }

            // If web isn't ready yet, queue it
            if !self.scmfWebReady || webView.isLoading || webView.url == nil || webView.window == nil {
                self.scmfPendingEvents.append(eventName)
                return
            }

            let js = """
            (function(){
              try { window.dispatchEvent(new Event('\(eventName)')); } catch(e) {}
            })();
            """

            webView.evaluateJavaScript(js) { [weak self] _, error in
                guard let self = self else { return }
                if error != nil {
                    // If eval fails, queue it and try later (next didFinish/foreground)
                    self.scmfPendingEvents.append(eventName)
                }
            }
        }
    }

    private func scmfFlushPendingEvents() {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            if UIApplication.shared.applicationState != .active { return }
            guard let webView = self.webView else { return }
            if !self.scmfWebReady || webView.isLoading || webView.url == nil || webView.window == nil { return }
            if self.scmfPendingEvents.isEmpty { return }

            let toSend = self.scmfPendingEvents
            self.scmfPendingEvents.removeAll()

            for ev in toSend {
                let js = "window.dispatchEvent(new Event('\(ev)'));"
                webView.evaluateJavaScript(js, completionHandler: nil)
            }

            print("📬 [SCMF] Flushed \(toSend.count) queued JS events ✅")
        }
    }

    // MARK: - Game Center Bridge Registration
    private func registerGameCenterBridgeHandler() {
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let webView = self.webView else {
                print("⚠️ [SCMF][GC] webView is nil – cannot register handler yet.")
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
}
