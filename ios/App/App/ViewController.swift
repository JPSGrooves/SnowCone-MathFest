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

    // MARK: - Handler Names (WKScriptMessageHandler)
    private let gameCenterHandlerName = "gameCenterBridge"
    private let audioHandlerName = "scmfAudioBridge" // optional: JS can change audio policy

    // MARK: - Lifecycle observers
    private var lifecycleObserversWired = false
    private var audioObserversWired = false

    // MARK: - WebView readiness + JS event queue
    private var scmfWebReady = false
    private var scmfPendingEvents: [String] = []
    private var lastBgFgState: Bool? = nil   // true = foreground, false = background (dedupe)

    // MARK: - Script install guards
    private var scmfScriptsInstalled = false
    private var scmfGameCenterHandlerRegistered = false
    private var scmfAudioHandlerRegistered = false

    // MARK: - Debug toggles
    private let debugJSBridge = true
    private let debugNativeHapticTestOnLaunch = false  // set true for one-shot native buzz test

    // MARK: - Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()

        print("🍧🍧🍧 [SCMF] ViewController.viewDidLoad – native shell is LIVE 🍧🍧🍧")

        // ✅ Make sure we can detect when the web app is truly ready.
        self.webView?.navigationDelegate = self

        // ✅ Apply SCMF audio policy (single source of truth)
        SCMFAudioSession.shared.apply()

        // ✅ Native lifecycle -> JS event bridge
        wireNativeLifecycleBridgeOnce()

        // ✅ Audio interruption/route-change bridge
        wireAudioSessionNotificationsOnce()

        // ✅ Inject native flag EARLY (DO NOT remove Capacitor scripts)
        installScmfUserScriptsOnce()

        // ✅ Register JS -> native bridges
        registerGameCenterBridgeHandlerOnce()
        registerAudioBridgeHandlerOnce()
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)

        // Optional: native-only haptic proof (bypasses Capacitor/JS entirely)
        if debugNativeHapticTestOnLaunch {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.75) {
                let gen = UIImpactFeedbackGenerator(style: .heavy)
                gen.prepare()
                gen.impactOccurred()
                print("✅ [SCMF] Native haptic test fired (heavy)")
            }
        }

        // Try flushing queued events after the view is visible
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) { [weak self] in
            self?.scmfFlushPendingEvents()
        }
    }

    deinit {
        if let webView = self.webView {
            let uc = webView.configuration.userContentController
            uc.removeScriptMessageHandler(forName: gameCenterHandlerName)
            uc.removeScriptMessageHandler(forName: audioHandlerName)
        }
        NotificationCenter.default.removeObserver(self)
    }

    // MARK: - WKNavigationDelegate (WebView is ready)
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        scmfWebReady = true
        print("⚡️  WebView loaded (didFinish) ✅")
        scmfFlushPendingEvents()
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

    // MARK: - Lifecycle (replace the four @objc handlers)

    private var scmfDidDeactivateForBg = false

    @objc private func onWillResignActive() {
        // ⚠️ DO NOT deactivate here.
        // willResignActive fires for modals/sheets/control center and causes "audio zombie"
        emitBgFg(isForeground: false, eventName: "scmf:nativeBackground")
    }

    @objc private func onDidEnterBackground() {
        // ✅ Only deactivate once, and only when actually backgrounded.
        if SCMFAudioSession.shared.policy == .respectSilentSwitch && !scmfDidDeactivateForBg {
            scmfDidDeactivateForBg = true
            SCMFAudioSession.shared.deactivate()
        }
        emitBgFg(isForeground: false, eventName: "scmf:nativeBackground")
    }

    @objc private func onWillEnterForeground() {
        // ✅ Foreground pre-wake (ok to call apply)
        SCMFAudioSession.shared.reactivateIfNeeded()
        emitBgFg(isForeground: true, eventName: "scmf:nativeForeground")
    }

    @objc private func onDidBecomeActive() {
        // ✅ Clear background-deactivate latch
        scmfDidDeactivateForBg = false

        // ✅ Re-apply policy
        SCMFAudioSession.shared.reactivateIfNeeded()
        emitBgFg(isForeground: true, eventName: "scmf:nativeForeground")

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.10) { [weak self] in
            self?.scmfFlushPendingEvents()
        }
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
            // ✅ Don't fake a background event.
            // Let JS pause naturally if it receives a playerror.
            // (Foreground event will come on .ended)


        case .ended:
            print("📳 [SCMF] Audio interruption ended")
            SCMFAudioSession.shared.reactivateIfNeeded()
            emitBgFg(isForeground: true, eventName: "scmf:nativeForeground")

        @unknown default:
            break
        }
    }

    @objc private func handleAudioRouteChange(_ notification: Notification) {
        print("🎧 [SCMF] Audio route changed")
        SCMFAudioSession.shared.reactivateIfNeeded()
        emitBgFg(isForeground: true, eventName: "scmf:nativeForeground")
    }
    
    
    
    // MARK: - SCMF User Scripts (EARLY) — DO NOT remove all scripts
    private func installScmfUserScriptsOnce() {
        if scmfScriptsInstalled { return }
        scmfScriptsInstalled = true

        guard let webView = self.webView else {
            print("⚠️ [SCMF] webView is nil – cannot install SCMF scripts yet.")
            return
        }

        let uc = webView.configuration.userContentController

        // 🚫 Do NOT call uc.removeAllUserScripts() here.
        // That can wipe Capacitor’s internal scripts and break plugin bridging (including Haptics).

        let js = """
        (function(){
          try {
            window.SC_IOS_NATIVE = true;

            // Stable helper for native->JS events
            if (!window.__SCMF_emitNativeEvent) {
              window.__SCMF_emitNativeEvent = function(name) {
                try { window.dispatchEvent(new Event(String(name))); } catch(e) {}
              };
            }
          } catch(e) {}
        })();
        """

        let script = WKUserScript(source: js, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        uc.addUserScript(script)

        print("✅ [SCMF] Installed WKUserScript: SC_IOS_NATIVE + __SCMF_emitNativeEvent (document start)")
    }

    // MARK: - JS Event Bridge (queue until WebView is ready + app active)
    private func scmfEmitEventToJS(_ eventName: String) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            if UIApplication.shared.applicationState != .active {
                if self.debugJSBridge { print("📦 [SCMF][JS] queued (inactive):", eventName) }
                self.scmfPendingEvents.append(eventName)
                return
            }

            guard let webView = self.webView else {
                if self.debugJSBridge { print("📦 [SCMF][JS] queued (no webView):", eventName) }
                self.scmfPendingEvents.append(eventName)
                return
            }

            if !self.scmfWebReady || webView.isLoading || webView.url == nil || webView.window == nil {
                if self.debugJSBridge { print("📦 [SCMF][JS] queued (not ready):", eventName) }
                self.scmfPendingEvents.append(eventName)
                return
            }

            self.scmfDispatchEvent(webView: webView, eventName: eventName) { [weak self] ok in
                guard let self = self else { return }
                if !ok {
                    if self.debugJSBridge { print("📦 [SCMF][JS] eval failed → re-queue:", eventName) }
                    self.scmfPendingEvents.append(eventName)
                }
            }
        }
    }

    private func scmfDispatchEvent(webView: WKWebView, eventName: String, completion: @escaping (Bool) -> Void) {
        if #available(iOS 14.0, *) {
            let js = "window.__SCMF_emitNativeEvent(eventName);"
            let args: [String: Any] = ["eventName": eventName]

            webView.callAsyncJavaScript(js, arguments: args, in: nil, in: .page) { result in
                switch result {
                case .success:
                    completion(true)
                case .failure(let error):
                    if self.debugJSBridge {
                        print("⚡️ [SCMF][JS] callAsyncJavaScript error:", error.localizedDescription)
                    }
                    completion(false)
                }
            }
            return
        }

        let fallback = "window.__SCMF_emitNativeEvent('\(eventName)');"
        webView.evaluateJavaScript(fallback) { _, error in
            if let error = error {
                if self.debugJSBridge {
                    print("⚡️ [SCMF][JS] evaluateJavaScript error:", error.localizedDescription)
                }
                completion(false)
            } else {
                completion(true)
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
                self.scmfDispatchEvent(webView: webView, eventName: ev) { _ in }
            }

            print("📬 [SCMF] Flushed \(toSend.count) queued JS events ✅")
        }
    }

    // MARK: - Game Center Bridge Registration
    private func registerGameCenterBridgeHandlerOnce() {
        if scmfGameCenterHandlerRegistered { return }
        scmfGameCenterHandlerRegistered = true

        DispatchQueue.main.async { [weak self] in
            guard let self = self, let webView = self.webView else {
                print("⚠️ [SCMF][GC] webView is nil – cannot register handler yet.")
                return
            }

            let uc = webView.configuration.userContentController
            uc.removeScriptMessageHandler(forName: self.gameCenterHandlerName)
            uc.add(self, name: self.gameCenterHandlerName)

            print("✅ [SCMF][GC] Registered WKScriptMessageHandler:", self.gameCenterHandlerName)
        }
    }

    // MARK: - Audio Bridge Registration (optional)
    private func registerAudioBridgeHandlerOnce() {
        if scmfAudioHandlerRegistered { return }
        scmfAudioHandlerRegistered = true

        DispatchQueue.main.async { [weak self] in
            guard let self = self, let webView = self.webView else {
                print("⚠️ [SCMF][Audio] webView is nil – cannot register handler yet.")
                return
            }

            let uc = webView.configuration.userContentController
            uc.removeScriptMessageHandler(forName: self.audioHandlerName)
            uc.add(self, name: self.audioHandlerName)

            print("✅ [SCMF][Audio] Registered WKScriptMessageHandler:", self.audioHandlerName)
        }
    }

    // MARK: - WKScriptMessageHandler
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if debugJSBridge {
            print("🧃 [SCMF] didReceive name=\(message.name) body=\(message.body)")
        }

        if message.name == gameCenterHandlerName {
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
            return
        }

        if message.name == audioHandlerName {
            if let dict = message.body as? [String: Any] {
                handleAudioPayload(dict)
                return
            }

            if let str = message.body as? String,
               let data = str.data(using: .utf8),
               let obj = try? JSONSerialization.jsonObject(with: data, options: []),
               let dict = obj as? [String: Any] {
                handleAudioPayload(dict)
                return
            }

            print("🔊⚠️ [SCMF][Audio] Unhandled message.body type:", type(of: message.body))
            return
        }

        if debugJSBridge {
            print("⚠️ [SCMF] Unknown WKScriptMessageHandler:", message.name)
        }
    }

    // MARK: - Audio Payload Router (optional)
    // MARK: - Audio Payload Router (optional)
    private func handleAudioPayload(_ payload: [String: Any]) {
        let type = (payload["type"] as? String) ?? ""

        switch type {
        case "setPolicy":
            let raw = (payload["policy"] as? String) ?? ""
            if let policy = SCMFAudioSession.Policy(rawValue: raw) {
                SCMFAudioSession.shared.setPolicy(policy)
                print("🔊 [SCMF][Audio] policy set via JS:", raw)
            } else {
                print("🔊⚠️ [SCMF][Audio] unknown policy:", raw)
            }

        default:
            print("🔊⚠️ [SCMF][Audio] unknown payload type:", type, "payload:", payload)
        }
    }


    // MARK: - Game Center Payload Router
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
