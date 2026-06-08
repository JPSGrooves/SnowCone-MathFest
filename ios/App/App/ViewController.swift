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
        // willResignActive fires for modals/sheets/control center and can cause audio zombie states.
        emitBgFg(isForeground: false, eventName: "scmf:nativeBackground")
    }

    @objc private func onDidEnterBackground() {
        // Native audio owns its own pause/resume now.
        SCMFNativeAudioPlayer.shared.handleAppDidEnterBackground()

        // For respectSilentSwitch/.ambient, background audio is not the goal.
        if SCMFAudioSession.shared.policy == .respectSilentSwitch && !scmfDidDeactivateForBg {
            scmfDidDeactivateForBg = true
            SCMFAudioSession.shared.deactivate()
        }

        emitBgFg(isForeground: false, eventName: "scmf:nativeBackground")
    }

    @objc private func onWillEnterForeground() {
        SCMFAudioSession.shared.reactivateIfNeeded()
        SCMFNativeAudioPlayer.shared.handleAppWillEnterForeground()

        emitBgFg(isForeground: true, eventName: "scmf:nativeForeground")
    }

    @objc private func onDidBecomeActive() {
        scmfDidDeactivateForBg = false

        SCMFAudioSession.shared.reactivateIfNeeded()
        SCMFNativeAudioPlayer.shared.handleAppDidBecomeActive()

        emitBgFg(isForeground: true, eventName: "scmf:nativeForeground")

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.10) { [weak self] in
            self?.scmfFlushPendingEvents()
        }
    }
    
    private func emitNativeAudioState() {
        let payload = SCMFNativeAudioPlayer.shared.musicStatePayload()

        guard
            let data = try? JSONSerialization.data(withJSONObject: payload, options: []),
            let json = String(data: data, encoding: .utf8)
        else {
            print("🎧⚠️ [SCMF][NativeAudio] failed to serialize music state")
            return
        }

        let js = """
        window.__SCMF_receiveNativeAudioState && window.__SCMF_receiveNativeAudioState(\(json));
        """

        DispatchQueue.main.async { [weak self] in
            self?.webView?.evaluateJavaScript(js) { _, error in
                if let error {
                    print("🎧⚠️ [SCMF][NativeAudio] emit state JS error:", error.localizedDescription)
                }
            }
        }
    }
    
    @objc private func handleSilenceSecondaryAudioHint(_ notification: Notification) {
        guard
            let info = notification.userInfo,
            let typeValue = info[AVAudioSessionSilenceSecondaryAudioHintTypeKey] as? UInt,
            let type = AVAudioSession.SilenceSecondaryAudioHintType(rawValue: typeValue)
        else {
            print("🎧⚠️ [SCMF] silenceSecondaryAudioHint received but could not parse type")
            return
        }

        switch type {
        case .begin:
            print("🎧 [SCMF] silenceSecondaryAudioHint began")
            SCMFNativeAudioPlayer.shared.handleExternalAudioBegan()

        case .end:
            print("🎧 [SCMF] silenceSecondaryAudioHint ended")
            SCMFNativeAudioPlayer.shared.handleExternalAudioEnded()

        @unknown default:
            break
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
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleSilenceSecondaryAudioHint(_:)),
            name: AVAudioSession.silenceSecondaryAudioHintNotification,
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
            SCMFNativeAudioPlayer.shared.handleInterruptionBegan()

        case .ended:
            print("📳 [SCMF] Audio interruption ended")
            SCMFAudioSession.shared.reactivateIfNeeded()
            SCMFNativeAudioPlayer.shared.handleInterruptionEnded()
            emitBgFg(isForeground: true, eventName: "scmf:nativeForeground")

        @unknown default:
            break
        }
    }

    @objc private func handleAudioRouteChange(_ notification: Notification) {
        print("🎧 [SCMF] Audio route changed")

        SCMFAudioSession.shared.reactivateIfNeeded()
        SCMFNativeAudioPlayer.shared.handleAppWillEnterForeground()

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.20) {
            SCMFNativeAudioPlayer.shared.tryResumeDeferredMusicIfAllowed(reason: "routeChange")
        }

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
            var shouldPrintMessage = true

            if message.name == audioHandlerName,
               let dict = message.body as? [String: Any],
               (dict["type"] as? String) == "requestMusicState" {
                shouldPrintMessage = false
            }

            if shouldPrintMessage {
                print("🧃 [SCMF] didReceive name=\(message.name) body=\(message.body)")
            }
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
        
        defer {
            emitNativeAudioState()
        }

        switch type {
            
        case "requestMusicState":
            break

        case "setPolicy":
            let raw = (payload["policy"] as? String) ?? ""
            if let policy = SCMFAudioSession.Policy(rawValue: raw) {
                SCMFAudioSession.shared.setPolicy(policy)
                print("🔊 [SCMF][Audio] policy set via JS:", raw)
            } else {
                print("🔊⚠️ [SCMF][Audio] unknown policy:", raw)
            }

        case "playTrack", "playMusic":
            guard let id = payload["id"] as? String, !id.isEmpty else {
                print("🔊⚠️ [SCMF][Audio] playTrack missing id:", payload)
                return
            }

            let volume = payload.keys.contains("volume")
                ? Float(coerceDouble(payload["volume"]))
                : nil

            let startRaw = coerceDouble(payload["startAt"])
            let startAt: TimeInterval? = startRaw > 0 ? startRaw : nil

            let loop = payload.keys.contains("looping")
                ? coerceBool(payload["looping"])
                : nil

            let allowExternalAudio = coerceBool(payload["allowExternalAudio"])

            SCMFNativeAudioPlayer.shared.playMusic(
                id: id,
                startAt: startAt,
                volume: volume,
                loop: loop,
                allowExternalAudio: allowExternalAudio
            )

        case "pauseTrack", "pauseMusic":
            SCMFNativeAudioPlayer.shared.pauseMusic()

        case "resumeTrack", "resumeMusic":
            let allowExternalAudio = coerceBool(payload["allowExternalAudio"])
            SCMFNativeAudioPlayer.shared.resumeMusic(allowExternalAudio: allowExternalAudio)

        case "togglePlayPause":
            SCMFNativeAudioPlayer.shared.togglePlayPause()

        case "stopTrack", "stopMusic":
            SCMFNativeAudioPlayer.shared.stopMusic()

        case "seekMusic":
            let seconds = coerceDouble(payload["seconds"])
            SCMFNativeAudioPlayer.shared.seekMusic(seconds: seconds)

        case "seekPercent", "seekMusicPercent":
            let percent = coerceDouble(payload["percent"])
            SCMFNativeAudioPlayer.shared.seekMusic(percent: percent)

        case "setLooping":
            SCMFNativeAudioPlayer.shared.setLooping(coerceBool(payload["looping"]))

        case "setMuted":
            SCMFNativeAudioPlayer.shared.setMuted(coerceBool(payload["muted"]))

        case "setMusicVolume":
            SCMFNativeAudioPlayer.shared.setMusicVolume(Float(coerceDouble(payload["volume"])))

        case "setSfxVolume":
            SCMFNativeAudioPlayer.shared.setSfxVolume(Float(coerceDouble(payload["volume"])))

        case "playSfx", "playSFX":
            guard let id = payload["id"] as? String, !id.isEmpty else {
                print("🔊⚠️ [SCMF][Audio] playSfx missing id:", payload)
                return
            }

            let volume = payload.keys.contains("volume")
                ? Float(coerceDouble(payload["volume"]))
                : nil

            SCMFNativeAudioPlayer.shared.playSfx(id: id, volume: volume)

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
    
    private func coerceBool(_ any: Any?) -> Bool {
        if let b = any as? Bool { return b }

        if let n = any as? Int { return n != 0 }
        if let n = any as? Double { return n != 0 }
        if let n = any as? Float { return n != 0 }

        if let s = any as? String {
            let lowered = s.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
            if lowered == "true" || lowered == "1" || lowered == "yes" || lowered == "y" {
                return true
            }
            if lowered == "false" || lowered == "0" || lowered == "no" || lowered == "n" {
                return false
            }
        }

        return false
    }
}
