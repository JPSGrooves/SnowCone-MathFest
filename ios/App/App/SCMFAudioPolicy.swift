//
//  SCMFAudioPolicy.swift
//  App
//
//  Single source of truth for audio category policy.
//
//  v1.1.0 audio rule:
//  - Configure the session early.
//  - Do NOT activate the session just because the app launched.
//  - Activate only when SCMF actually plays music or SFX.
//  - This helps SCMF detect external Apple Music / Spotify correctly.
//

import Foundation
import AVFoundation

final class SCMFAudioSession {

    static let shared = SCMFAudioSession()

    enum Policy: String {
        case respectSilentSwitch   // .ambient: respects Silent Switch, no background audio
        case backgroundPlayback    // .playback: ignores Silent Switch, background capable
    }

    private(set) var policy: Policy = .respectSilentSwitch
    private(set) var isActive: Bool = false

    private init() {}

    func setPolicy(_ newPolicy: Policy) {
        policy = newPolicy

        if isActive {
            activate()
        } else {
            configure()
        }
    }

    /// Backward-compatible name used by older SCMF code.
    ///
    /// Important:
    /// This now CONFIGURES ONLY.
    /// It does NOT activate the audio session.
    ///
    /// Why:
    /// Activating at launch can make iOS audio-state detection weird.
    /// SCMF should only take audio ownership when it is actually playing audio.
    func apply() {
        configure()
    }

    /// Set category/options without taking active audio ownership.
    ///
    /// Safe to call:
    /// - app launch
    /// - foreground
    /// - before checking external audio
    func configure() {
        let session = AVAudioSession.sharedInstance()

        do {
            switch policy {
            case .respectSilentSwitch:
                try session.setCategory(
                    .ambient,
                    mode: .default,
                    options: [.mixWithOthers]
                )

            case .backgroundPlayback:
                try session.setCategory(
                    .playback,
                    mode: .default,
                    options: [.mixWithOthers]
                )
            }

            print("🔊 [SCMF] AudioSession configured policy=\(policy.rawValue) category=\(session.category.rawValue)")
        } catch {
            print("⚠️ [SCMF] AudioSession configure failed:", error.localizedDescription)
        }
    }

    /// Take active ownership of the audio session.
    ///
    /// Only call this immediately before SCMF actually plays:
    /// - native music
    /// - native SFX
    @discardableResult
    func activate() -> Bool {
        let session = AVAudioSession.sharedInstance()

        do {
            configure()
            try session.setActive(true)
            isActive = true

            print("🔊 [SCMF] AudioSession activated policy=\(policy.rawValue) category=\(session.category.rawValue)")
            return true
        } catch {
            isActive = false
            print("⚠️ [SCMF] AudioSession activate failed:", error.localizedDescription)
            return false
        }
    }

    /// Release SCMF audio ownership.
    ///
    /// This is important when backgrounding or letting user music take priority.
    func deactivate() {
        let session = AVAudioSession.sharedInstance()

        do {
            try session.setActive(false, options: .notifyOthersOnDeactivation)
            isActive = false

            print("🔇 [SCMF] AudioSession deactivated")
        } catch {
            print("⚠️ [SCMF] AudioSession deactivate failed:", error.localizedDescription)
        }
    }

    /// Backward-compatible name used by ViewController.
    ///
    /// Important:
    /// This now configures only.
    /// It does NOT reactivate.
    func reactivateIfNeeded() {
        configure()
    }
}
