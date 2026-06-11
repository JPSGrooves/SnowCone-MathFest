//
//  SCMFNativeAudioPlayer.swift
//  App
//
//  Native iOS audio owner for SnowCone MathFest.
//  Goal:
//  - Music + SFX go through AVAudioPlayer on iOS.
//  - Silent switch behavior follows SCMFAudioSession policy.
//  - JS/Howler no longer owns iOS playback stability.
//

import Foundation
import AVFoundation
import UIKit

final class SCMFNativeAudioPlayer: NSObject, AVAudioPlayerDelegate {

    static let shared = SCMFNativeAudioPlayer()

    private struct AudioAsset {
        let id: String
        let name: String
        let file: String
    }
    
    private struct DeferredMusicRequest {
        let id: String
        let startAt: TimeInterval?
        let volume: Float?
        let loop: Bool?
    }

    // MARK: - Track catalog

    private let tracks: [String: AudioAsset] = [
        "quikserve": AudioAsset(
            id: "quikserve",
            name: "QuikServe OG",
            file: "quikserveST_OG.mp3"
        ),
        "kktribute": AudioAsset(
            id: "kktribute",
            name: "KK Tribute",
            file: "KKtribute.mp3"
        ),
        "softdown": AudioAsset(
            id: "softdown",
            name: "Soft Down Math Vibes",
            file: "softDownMathVibes.mp3"
        ),
        "infadd": AudioAsset(
            id: "infadd",
            name: "Infinity Addition",
            file: "InfinityAddition.mp3"
        ),
        "sc90": AudioAsset(
            id: "sc90",
            name: "SnowCone 90",
            file: "sc_90.mp3"
        ),
        "nothingorg": AudioAsset(
            id: "nothingorg",
            name: "Nothing Organic",
            file: "nothing_organic.mp3"
        ),
        "secrets": AudioAsset(
            id: "secrets",
            name: "Secrets of Math",
            file: "secretsOfMath.mp3"
        ),
        "stoopidelectro": AudioAsset(
            id: "stoopidelectro",
            name: "Stoopid Electro",
            file: "stoopidElectro.mp3"
        ),
        "prologue": AudioAsset(
            id: "prologue",
            name: "Story Prologue",
            file: "prologueTrack.mp3"
        ),
        "kittyPaws": AudioAsset(
            id: "kittyPaws",
            name: "Kitty Paws",
            file: "kittyPaws.mp3"
        ),
        "patchrelaxes": AudioAsset(
            id: "patchrelaxes",
            name: "Patch Relaxes",
            file: "patchRelaxes.mp3"
        ),
        "bonusTime": AudioAsset(
            id: "bonusTime",
            name: "Bonus Time",
            file: "bonusTime.mp3"
        ),
        "lastRun": AudioAsset(
            id: "lastRun",
            name: "Last Run",
            file: "lastRun.mp3"
        )
    ]

    // MARK: - SFX catalog

    private let sfx: [String: AudioAsset] = [
        "correct": AudioAsset(
            id: "correct",
            name: "Correct",
            file: "correct.mp3"
        ),
        "incorrect": AudioAsset(
            id: "incorrect",
            name: "Incorrect",
            file: "incorrect.mp3"
        ),
        "milestone": AudioAsset(
            id: "milestone",
            name: "QuikServe Milestone",
            file: "QuikServemilestone.mp3"
        ),
        "QuikServemilestone": AudioAsset(
            id: "QuikServemilestone",
            name: "QuikServe Milestone",
            file: "QuikServemilestone.mp3"
        ),
        "points100": AudioAsset(
            id: "points100",
            name: "QuikServe 100 Points",
            file: "QuikServepoints100.mp3"
        ),
        "QuikServepoints100": AudioAsset(
            id: "QuikServepoints100",
            name: "QuikServe 100 Points",
            file: "QuikServepoints100.mp3"
        ),
        "mosquito": AudioAsset(
            id: "mosquito",
            name: "Mosquito",
            file: "mosquito.mp3"
        ),
        "tentSuccess": AudioAsset(
            id: "tentSuccess",
            name: "Tent Success",
            file: "tentSuccess.mp3"
        ),
        "smDing": AudioAsset(
            id: "smDing",
            name: "Small Ding",
            file: "smDing.mp3"
        ),
        "smDing2": AudioAsset(
            id: "smDing2",
            name: "Small Ding 2",
            file: "smDing2.mp3"
        ),
        "honk1": AudioAsset(
            id: "honk1",
            name: "Honk 1",
            file: "honk1.mp3"
        ),
        "honk2": AudioAsset(
            id: "honk2",
            name: "Honk 2",
            file: "honk2.mp3"
        ),
        "honk3": AudioAsset(
            id: "honk3",
            name: "Honk 3",
            file: "honk3.mp3"
        ),
        "honk4": AudioAsset(
            id: "honk4",
            name: "Honk 4",
            file: "honk4.mp3"
        ),
        "honk5": AudioAsset(
            id: "honk5",
            name: "Honk 5",
            file: "honk5.mp3"
        )
    ]

    // MARK: - State

    private var musicPlayer: AVAudioPlayer?
    private var sfxPlayers: [AVAudioPlayer] = []

    private(set) var currentTrackId: String?
    private(set) var currentTrackName: String?

    private var musicVolume: Float = 0.70
    private var sfxVolume: Float = 0.35

    private var muted: Bool = false
    private var looping: Bool = false

    private var shouldResumeAfterForeground: Bool = false
    private var shouldResumeAfterInterruption: Bool = false
    
    private var deferredMusicRequest: DeferredMusicRequest?
    private var externalAudioSuppressionActive: Bool = false

    private var externalAudioPollTimer: Timer?
    private var externalAudioClearCount: Int = 0

    // Tracks AVAudioSession silence hint notifications.
    // The live secondaryAudioShouldBeSilencedHint remains the source of truth,
    // but this helps logging and suppression flow stay readable.
    private var externalAudioHintActive: Bool = false
    
    private var musicDidFinishNaturally: Bool = false

    // Manual pause is sacred.
    // If the player pauses the Radio, native interruption/external-audio logic
    // must not resurrect the track later.
    private var userPausedMusic: Bool = false
    
    private override init() {
        super.init()
    }

    // MARK: - Public music API

    func playMusic(
        id rawId: String,
        startAt: TimeInterval? = nil,
        volume: Float? = nil,
        loop: Bool? = nil,
        allowExternalAudio: Bool = false
    ) {
        let id = normalizeAudioId(rawId)

        guard let asset = tracks[id] else {
            print("🔊⚠️ [SCMF][NativeAudio] Unknown music id:", rawId)
            return
        }

        userPausedMusic = false
        shouldResumeAfterForeground = false
        shouldResumeAfterInterruption = false

        // Configure category only. Do NOT activate before checking external audio.
        SCMFAudioSession.shared.configure()

        if !allowExternalAudio && shouldLetExternalAudioWin() {
            deferredMusicRequest = DeferredMusicRequest(
                id: asset.id,
                startAt: startAt,
                volume: volume,
                loop: loop
            )

            externalAudioSuppressionActive = true

            if let player = musicPlayer, player.isPlaying {
                player.pause()
            }

            currentTrackId = asset.id
            currentTrackName = asset.name

            startExternalAudioPollIfNeeded(reason: "blocked playMusic \(asset.id)")

            print("🎧 [SCMF][NativeAudio] blocked playMusic id=\(asset.id); external audio owns soundtrack")
            return
        }

        guard let url = urlForAudioFile(asset.file, folder: "tracks") else {
            print("🔊❌ [SCMF][NativeAudio] Missing music file:", asset.file)
            return
        }

        stopExternalAudioPoll()
        externalAudioSuppressionActive = false
        deferredMusicRequest = nil

        guard SCMFAudioSession.shared.activate() else {
            print("🔊❌ [SCMF][NativeAudio] playMusic aborted; audio session did not activate")
            return
        }

        if let volume {
            musicVolume = clampVolume(volume)
        }

        if let loop {
            looping = loop
        }

        do {
            let player = try AVAudioPlayer(contentsOf: url)
            player.delegate = self
            player.numberOfLoops = looping ? -1 : 0
            player.volume = muted ? 0.0 : musicVolume
            player.prepareToPlay()

            if let startAt, startAt > 0, startAt.isFinite {
                let safeTime = min(max(0, startAt), player.duration)
                player.currentTime = safeTime
            }

            musicPlayer?.stop()
            musicPlayer = player
            currentTrackId = asset.id
            currentTrackName = asset.name
            
            musicDidFinishNaturally = false

            player.play()

            print("🎵 [SCMF][NativeAudio] playMusic id=\(asset.id) file=\(asset.file) muted=\(muted) loop=\(looping) allowExternalAudio=\(allowExternalAudio)")
        } catch {
            print("🔊❌ [SCMF][NativeAudio] playMusic failed:", error.localizedDescription)
        }
    }
    
    func pauseMusic() {
        guard let player = musicPlayer else { return }

        userPausedMusic = true
        shouldResumeAfterForeground = false
        shouldResumeAfterInterruption = false

        deferredMusicRequest = nil
        externalAudioSuppressionActive = false
        stopExternalAudioPoll()

        if player.isPlaying {
            player.pause()
            print("⏸️ [SCMF][NativeAudio] pauseMusic id=\(currentTrackId ?? "(none)") userPaused=true")
        } else {
            print("⏸️ [SCMF][NativeAudio] pauseMusic ignored; already paused id=\(currentTrackId ?? "(none)") userPaused=true")
        }
    }

    func resumeMusic(allowExternalAudio: Bool = false) {
        guard let player = musicPlayer else {
            userPausedMusic = false
            tryResumeDeferredMusicIfAllowed(reason: "resumeMusic-no-player")
            return
        }

        userPausedMusic = false

        SCMFAudioSession.shared.configure()

        if !allowExternalAudio && shouldLetExternalAudioWin() {
            if let id = currentTrackId {
                deferredMusicRequest = DeferredMusicRequest(
                    id: id,
                    startAt: player.currentTime,
                    volume: musicVolume,
                    loop: looping
                )
            }

            externalAudioSuppressionActive = true

            if player.isPlaying {
                player.pause()
            }

            startExternalAudioPollIfNeeded(reason: "blocked resumeMusic")

            print("🎧 [SCMF][NativeAudio] resumeMusic blocked; external audio owns soundtrack")
            return
        }

        guard SCMFAudioSession.shared.activate() else {
            print("🔊❌ [SCMF][NativeAudio] resumeMusic aborted; audio session did not activate")
            return
        }

        if !player.isPlaying {
            stopExternalAudioPoll()
            externalAudioSuppressionActive = false
            player.volume = muted ? 0.0 : musicVolume
            musicDidFinishNaturally = false
            player.play()
            print("▶️ [SCMF][NativeAudio] resumeMusic id=\(currentTrackId ?? "(none)") allowExternalAudio=\(allowExternalAudio)")
        }
    }
    
    func togglePlayPause() {
        guard let player = musicPlayer else {
            if let first = tracks.keys.sorted().first {
                playMusic(id: first)
            }
            return
        }

        if player.isPlaying {
            pauseMusic()
        } else {
            // This is treated as a manual user command.
            resumeMusic(allowExternalAudio: true)
        }
    }

    func stopMusic() {
        if let player = musicPlayer {
            player.stop()
            player.currentTime = 0
        }

        musicPlayer = nil
        currentTrackId = nil
        currentTrackName = nil
        shouldResumeAfterForeground = false
        shouldResumeAfterInterruption = false

        deferredMusicRequest = nil
        externalAudioSuppressionActive = false
        stopExternalAudioPoll()
        
        musicDidFinishNaturally = false
        userPausedMusic = false

        print("🛑 [SCMF][NativeAudio] stopMusic")
    }

    func seekMusic(seconds: TimeInterval) {
        guard let player = musicPlayer else { return }

        let safeTime = min(max(0, seconds), player.duration)
        player.currentTime = safeTime
        musicDidFinishNaturally = false

        print("🎚️ [SCMF][NativeAudio] seekMusic \(safeTime)")
    }
    
    func seekMusic(percent rawPercent: Double) {
        let percent = min(1.0, max(0.0, rawPercent))

        if let player = musicPlayer {
            let target = player.duration * percent
            player.currentTime = min(max(0, target), player.duration)
            musicDidFinishNaturally = false

            print("🎚️ [SCMF][NativeAudio] seekMusic percent=\(percent) seconds=\(player.currentTime)")
            return
        }

        guard let request = deferredMusicRequest else {
            print("🎚️ [SCMF][NativeAudio] seekMusic percent ignored; no player or deferred request")
            return
        }

        guard let duration = durationForTrackId(request.id) else {
            print("🎚️ [SCMF][NativeAudio] seekMusic percent ignored; no duration for deferred id=\(request.id)")
            return
        }

        let target = duration * percent

        deferredMusicRequest = DeferredMusicRequest(
            id: request.id,
            startAt: target,
            volume: request.volume,
            loop: request.loop
        )

        print("🎚️ [SCMF][NativeAudio] seekMusic parked percent=\(percent) seconds=\(target) id=\(request.id)")
    }

    func setLooping(_ value: Bool) {
        looping = value

        // Important:
        // Toggling loop should never leave an old natural-end flag alive.
        // Otherwise the JS lane can see "ended" later and skip tracks by accident.
        musicDidFinishNaturally = false

        musicPlayer?.numberOfLoops = looping ? -1 : 0

        print("🔁 [SCMF][NativeAudio] setLooping \(looping)")
    }

    func setMusicVolume(_ value: Float) {
        musicVolume = clampVolume(value)
        musicPlayer?.volume = muted ? 0.0 : musicVolume

        print("🔉 [SCMF][NativeAudio] setMusicVolume \(musicVolume)")
    }

    func setSfxVolume(_ value: Float) {
        sfxVolume = clampVolume(value)

        print("🔉 [SCMF][NativeAudio] setSfxVolume \(sfxVolume)")
    }

    func setMuted(_ value: Bool) {
        muted = value

        musicPlayer?.volume = muted ? 0.0 : musicVolume

        if muted {
            for player in sfxPlayers {
                player.stop()
            }
            sfxPlayers.removeAll()
        }

        print("🔇 [SCMF][NativeAudio] setMuted \(muted)")
    }

    func isPlayingMusic() -> Bool {
        return musicPlayer?.isPlaying == true
    }
    
    func musicStatePayload() -> [String: Any] {
        let player = musicPlayer

        let trackId =
            currentTrackId ??
            deferredMusicRequest?.id ??
            ""

        let trackName =
            currentTrackName ??
            trackNameForTrackId(trackId) ??
            ""

        let duration: TimeInterval = {
            if let player {
                return player.duration
            }

            if let id = deferredMusicRequest?.id,
               let d = durationForTrackId(id) {
                return d
            }

            if !trackId.isEmpty,
               let d = durationForTrackId(trackId) {
                return d
            }

            return 0
        }()

        let currentTime: TimeInterval = {
            if musicDidFinishNaturally {
                return duration
            }

            if let player {
                return player.currentTime
            }

            if let startAt = deferredMusicRequest?.startAt {
                return max(0, min(startAt, duration))
            }

            return 0
        }()

        let seekPercent: Double = {
            guard duration > 0 else { return 0 }
            return max(0, min(1, currentTime / duration))
        }()

        return [
            "playing": player?.isPlaying == true,
            "trackId": trackId,
            "trackName": trackName,
            "currentTime": currentTime,
            "duration": duration,
            "seekPercent": seekPercent,
            "muted": muted,
            "looping": looping,
            "suppressedByExternalAudio": externalAudioSuppressionActive || externalAudioHintActive,
            "hasDeferred": deferredMusicRequest != nil,
            "ended": musicDidFinishNaturally,
            "userPaused": userPausedMusic,
        ]
    }

    // MARK: - Public SFX API

    func playSfx(id rawId: String, volume: Float? = nil) {
        if muted {
            print("🔇 [SCMF][NativeAudio] playSfx ignored because muted:", rawId)
            return
        }

        let id = normalizeAudioId(rawId)

        guard let asset = sfx[id] else {
            print("🔊⚠️ [SCMF][NativeAudio] Unknown sfx id:", rawId)
            return
        }

        guard let url = urlForAudioFile(asset.file, folder: "SFX") else {
            print("🔊❌ [SCMF][NativeAudio] Missing sfx file:", asset.file)
            return
        }

        guard SCMFAudioSession.shared.activate() else {
            print("🔊❌ [SCMF][NativeAudio] playSfx aborted; audio session did not activate")
            return
        }

        do {
            let player = try AVAudioPlayer(contentsOf: url)
            player.delegate = self
            player.numberOfLoops = 0
            player.volume = clampVolume(volume ?? sfxVolume)
            player.prepareToPlay()

            sfxPlayers.append(player)
            player.play()

            print("✨ [SCMF][NativeAudio] playSfx id=\(asset.id) file=\(asset.file)")
        } catch {
            print("🔊❌ [SCMF][NativeAudio] playSfx failed:", error.localizedDescription)
        }
    }
    // MARK: - App lifecycle

    func handleAppDidEnterBackground() {
        if let player = musicPlayer, player.isPlaying {
            shouldResumeAfterForeground = true

            if let id = currentTrackId {
                deferredMusicRequest = DeferredMusicRequest(
                    id: id,
                    startAt: player.currentTime,
                    volume: musicVolume,
                    loop: looping
                )
            }

            player.pause()
            print("📦 [SCMF][NativeAudio] background pause; deferred current soundtrack")
        } else {
            shouldResumeAfterForeground = false
        }

        for player in sfxPlayers {
            player.stop()
        }
        sfxPlayers.removeAll()
        
        stopExternalAudioPoll()
    }

    func handleAppWillEnterForeground() {
        // Configure only. Do not activate yet.
        SCMFAudioSession.shared.configure()
    }

    func handleAppDidBecomeActive() {
        SCMFAudioSession.shared.configure()

        if shouldLetExternalAudioWin() {
            shouldResumeAfterForeground = false
            externalAudioSuppressionActive = true
            startExternalAudioPollIfNeeded(reason: "didBecomeActive external active")
            print("🎧 [SCMF][NativeAudio] didBecomeActive; external audio still owns soundtrack")
            return
        }

        externalAudioSuppressionActive = false

        if shouldResumeAfterForeground {
            shouldResumeAfterForeground = false

            DispatchQueue.main.asyncAfter(deadline: .now() + 0.12) { [weak self] in
                guard let self = self else { return }

                if self.shouldLetExternalAudioWin() {
                    self.externalAudioSuppressionActive = true
                    self.startExternalAudioPollIfNeeded(reason: "delayed foreground external active")
                    print("🎧 [SCMF][NativeAudio] delayed foreground resume canceled; external audio owns soundtrack")
                    return
                }

                self.resumeMusic()
            }

            return
        }

        tryResumeDeferredMusicIfAllowed(reason: "didBecomeActive")
    }
    
    func handleInterruptionBegan() {
        let wasPlaying = musicPlayer?.isPlaying == true

        shouldResumeAfterInterruption = wasPlaying && !userPausedMusic

        if let player = musicPlayer, wasPlaying {
            if let id = currentTrackId {
                deferredMusicRequest = DeferredMusicRequest(
                    id: id,
                    startAt: player.currentTime,
                    volume: musicVolume,
                    loop: looping
                )
            }

            player.pause()
        } else if userPausedMusic {
            deferredMusicRequest = nil
        }

        for player in sfxPlayers {
            player.stop()
        }
        sfxPlayers.removeAll()

        if shouldResumeAfterInterruption {
            externalAudioSuppressionActive = true
            startExternalAudioPollIfNeeded(reason: "interruption began")
        } else {
            externalAudioSuppressionActive = false
            stopExternalAudioPoll()
        }

        print("📵 [SCMF][NativeAudio] interruption began; shouldResume=\(shouldResumeAfterInterruption) userPaused=\(userPausedMusic)")
    }
    
    func handleInterruptionEnded() {
        SCMFAudioSession.shared.configure()
        
        if userPausedMusic {
            shouldResumeAfterInterruption = false
            deferredMusicRequest = nil
            externalAudioSuppressionActive = false
            stopExternalAudioPoll()

            print("📳 [SCMF][NativeAudio] interruption ended; not resuming because userPaused=true")
            return
        }

        if shouldLetExternalAudioWin() {
            shouldResumeAfterInterruption = false
            externalAudioSuppressionActive = true
            startExternalAudioPollIfNeeded(reason: "interruption ended but external active")
            print("📳 [SCMF][NativeAudio] interruption ended; external audio owns soundtrack")
            return
        }

        externalAudioSuppressionActive = false

        if shouldResumeAfterInterruption {
            shouldResumeAfterInterruption = false

            DispatchQueue.main.asyncAfter(deadline: .now() + 0.12) { [weak self] in
                guard let self = self else { return }

                if self.shouldLetExternalAudioWin() {
                    self.externalAudioSuppressionActive = true
                    self.startExternalAudioPollIfNeeded(reason: "delayed interruption external active")
                    print("📳 [SCMF][NativeAudio] delayed interruption resume canceled; external audio owns soundtrack")
                    return
                }

                self.resumeMusic()
            }

            print("📳 [SCMF][NativeAudio] interruption ended; attempting SCMF resume")
            return
        }

        tryResumeDeferredMusicIfAllowed(reason: "interruptionEnded")
        print("📳 [SCMF][NativeAudio] interruption ended")
    }
    
    // MARK: - AVAudioPlayerDelegate

    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        sfxPlayers.removeAll { $0 === player }

        if player === musicPlayer {
            // Defensive guard:
            // A loop boundary should not become a JS "ended" event.
            // Swift is the turntable; JS only advances when this flag is truly final.
            if looping {
                musicDidFinishNaturally = false
                print("🔁 [SCMF][NativeAudio] loop boundary ignored as track end id=\(currentTrackId ?? "(none)")")
                return
            }

            musicDidFinishNaturally = true
            shouldResumeAfterForeground = false
            shouldResumeAfterInterruption = false

            print("🎵 [SCMF][NativeAudio] music finished id=\(currentTrackId ?? "(none)") successfully=\(flag)")
        }
    }

    func audioPlayerDecodeErrorDidOccur(_ player: AVAudioPlayer, error: Error?) {
        sfxPlayers.removeAll { $0 === player }

        if player === musicPlayer {
            print("🔊❌ [SCMF][NativeAudio] music decode error:", error?.localizedDescription ?? "(unknown)")
        } else {
            print("🔊❌ [SCMF][NativeAudio] sfx decode error:", error?.localizedDescription ?? "(unknown)")
        }
    }

    // MARK: - Helpers

    private func clampVolume(_ value: Float) -> Float {
        return min(1.0, max(0.0, value))
    }

    private func normalizeAudioId(_ raw: String) -> String {
        var id = raw.trimmingCharacters(in: .whitespacesAndNewlines)

        if id.hasSuffix(".mp3") {
            id = String(id.dropLast(4))
        }

        switch id {
        case "QuikServepointsmilestone":
            return "milestone"
        case "QuikServemilestone":
            return "milestone"
        case "QuikServepoints100":
            return "points100"
        default:
            return id
        }
    }
    
    private func shouldLetExternalAudioWin() -> Bool {
        let session = AVAudioSession.sharedInstance()

        let otherAudioPlaying = session.isOtherAudioPlaying
        let secondaryShouldSilence = session.secondaryAudioShouldBeSilencedHint

        // Important discovery:
        // isOtherAudioPlaying is noisy inside Capacitor/WKWebView.
        // It can report true even when SCMF itself is the only app trying audio.
        //
        // secondaryAudioShouldBeSilencedHint is the better signal for:
        // "Should this game's secondary soundtrack get out of the user's way?"
        externalAudioHintActive = secondaryShouldSilence

        print("🎧 [SCMF][NativeAudio] external check isOtherAudioPlaying=\(otherAudioPlaying) secondaryHint=\(secondaryShouldSilence) hintActive=\(externalAudioHintActive) sessionActive=\(SCMFAudioSession.shared.isActive)")

        return secondaryShouldSilence
    }
    
    private func trackNameForTrackId(_ id: String) -> String? {
        return tracks[id]?.name
    }
    
    private func durationForTrackId(_ id: String) -> TimeInterval? {
        guard let asset = tracks[id] else {
            return nil
        }

        guard let url = urlForAudioFile(asset.file, folder: "tracks") else {
            return nil
        }

        do {
            let player = try AVAudioPlayer(contentsOf: url)
            return player.duration
        } catch {
            print("🎚️⚠️ [SCMF][NativeAudio] duration lookup failed id=\(id):", error.localizedDescription)
            return nil
        }
    }
    
    private func urlForAudioFile(_ file: String, folder: String) -> URL? {
        guard let resourceURL = Bundle.main.resourceURL else {
            print("🔊❌ [SCMF][NativeAudio] Bundle.main.resourceURL missing")
            return nil
        }

        let candidates = [
            resourceURL.appendingPathComponent("public/assets/audio/\(folder)/\(file)"),
            resourceURL.appendingPathComponent("assets/audio/\(folder)/\(file)"),
            resourceURL.appendingPathComponent("App/public/assets/audio/\(folder)/\(file)")
        ]

        for url in candidates {
            if FileManager.default.fileExists(atPath: url.path) {
                return url
            }
        }

        print("🔊❌ [SCMF][NativeAudio] file not found:", file)
        print("🔊🔎 [SCMF][NativeAudio] checked:")
        for url in candidates {
            print(" -", url.path)
        }

        return nil
    }
    
    func handleExternalAudioBegan() {
        externalAudioHintActive = true

        if userPausedMusic {
            deferredMusicRequest = nil
            externalAudioSuppressionActive = false
            stopExternalAudioPoll()

            print("🎧 [SCMF][NativeAudio] external audio began; ignored because userPaused=true")
            return
        }

        externalAudioSuppressionActive = true

        if let player = musicPlayer, player.isPlaying {
            if let id = currentTrackId {
                deferredMusicRequest = DeferredMusicRequest(
                    id: id,
                    startAt: player.currentTime,
                    volume: musicVolume,
                    loop: looping
                )
            }

            player.pause()
            startExternalAudioPollIfNeeded(reason: "silence hint began")

            print("🎧 [SCMF][NativeAudio] external audio began; SCMF soundtrack suppressed")
        } else {
            print("🎧 [SCMF][NativeAudio] external audio began; no active SCMF music to suppress")
        }
    }

    func handleExternalAudioEnded() {
        externalAudioHintActive = false
        externalAudioSuppressionActive = false
        stopExternalAudioPoll()

        if userPausedMusic {
            deferredMusicRequest = nil
            print("🎧 [SCMF][NativeAudio] external audio ended; not resuming because userPaused=true")
            return
        }

        print("🎧 [SCMF][NativeAudio] external audio ended; SCMF may resume soundtrack")

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.18) { [weak self] in
            self?.tryResumeDeferredMusicIfAllowed(reason: "externalAudioEnded")
        }
    }

    func tryResumeDeferredMusicIfAllowed(reason: String = "unknown") {
        guard let request = deferredMusicRequest else {
            return
        }

        if userPausedMusic {
            deferredMusicRequest = nil
            externalAudioSuppressionActive = false
            stopExternalAudioPoll()

            print("🎧 [SCMF][NativeAudio] deferred resume blocked (\(reason)); userPaused=true")
            return
        }

        // Do not try to activate/play while app is inactive/backgrounding.
        // That caused "Session activation failed" during testing.
        guard isAppActiveForAudioResume() else {
            print("🎧 [SCMF][NativeAudio] deferred resume held (\(reason)); app is not active")
            return
        }

        SCMFAudioSession.shared.configure()

        if shouldLetExternalAudioWin() {
            externalAudioSuppressionActive = true
            startExternalAudioPollIfNeeded(reason: "deferred blocked \(reason)")
            print("🎧 [SCMF][NativeAudio] deferred resume blocked (\(reason)); external audio still active")
            return
        }

        deferredMusicRequest = nil
        externalAudioSuppressionActive = false
        stopExternalAudioPoll()

        print("🎵 [SCMF][NativeAudio] resuming deferred SCMF track id=\(request.id) reason=\(reason)")

        playMusic(
            id: request.id,
            startAt: request.startAt,
            volume: request.volume,
            loop: request.loop,
            allowExternalAudio: true
        )
    }
    
    private func isAppActiveForAudioResume() -> Bool {
        return UIApplication.shared.applicationState == .active
    }
    
    private func startExternalAudioPollIfNeeded(reason: String) {
        if externalAudioPollTimer != nil {
            return
        }

        externalAudioClearCount = 0

        let timer = Timer(timeInterval: 0.75, repeats: true) { [weak self] _ in
            self?.pollExternalAudio(reason: reason)
        }

        externalAudioPollTimer = timer
        RunLoop.main.add(timer, forMode: .common)

        print("🎧 [SCMF][NativeAudio] started external audio poll reason=\(reason)")
    }

    private func stopExternalAudioPoll() {
        externalAudioPollTimer?.invalidate()
        externalAudioPollTimer = nil
        externalAudioClearCount = 0
    }

    private func pollExternalAudio(reason: String) {
        // Do not poll/log while the app is inactive.
        // didBecomeActive will re-check and either resume deferred music
        // or restart polling if external audio still owns the soundtrack.
        guard isAppActiveForAudioResume() else {
            return
        }

        if shouldLetExternalAudioWin() {
            externalAudioClearCount = 0
            return
        }

        externalAudioClearCount += 1

        print("🎧 [SCMF][NativeAudio] external audio clear poll \(externalAudioClearCount)/2 reason=\(reason)")

        guard externalAudioClearCount >= 2 else {
            return
        }

        stopExternalAudioPoll()
        handleExternalAudioEnded()
    }
}


