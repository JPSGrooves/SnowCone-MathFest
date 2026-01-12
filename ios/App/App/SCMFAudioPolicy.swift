//
//  SCMFAudioSession.swift
//  App
//
//  Single source of truth for audio category policy.
//  iOS reality: background playback conflicts with Silent Switch respect.
//

import Foundation
import AVFoundation

final class SCMFAudioSession {

    static let shared = SCMFAudioSession()

    enum Policy: String {
        case respectSilentSwitch   // .ambient (mutes w/ silent switch, BUT no bg audio)
        case backgroundPlayback    // .playback (bg audio, BUT ignores silent switch)
    }

    // Default for a game where users expect Silent Switch to work.
    private(set) var policy: Policy = .respectSilentSwitch

    private init() {}

    func setPolicy(_ newPolicy: Policy) {
        policy = newPolicy
        apply()
    }

    func apply() {
        let session = AVAudioSession.sharedInstance()

        do {
            switch policy {
            case .respectSilentSwitch:
                // ✅ Respects Silent Switch
                // ✅ Mixes with other audio (Spotify etc.)
                // 🚫 Will NOT keep playing in background/lock screen
                try session.setCategory(.ambient, mode: .default, options: [.mixWithOthers])

            case .backgroundPlayback:
                // ✅ Keeps playing in background/lock screen (if Background Mode Audio enabled)
                // 🚫 Ignores Silent Switch
                // ✅ Mixes with others so users can keep their music if they want
                try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
            }

            try session.setActive(true)
            print("🔊 [SCMF] AudioSession applied policy=\(policy.rawValue) category=\(session.category.rawValue)")
        } catch {
            print("⚠️ [SCMF] AudioSession apply failed:", error.localizedDescription)
        }
    }

    /// Call when the app is backgrounding / resigning active.
    /// This helps avoid the “zombie” audio state when returning.
    func deactivate() {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setActive(false, options: .notifyOthersOnDeactivation)
            print("🔇 [SCMF] AudioSession deactivated")
        } catch {
            print("⚠️ [SCMF] AudioSession deactivate failed:", error.localizedDescription)
        }
    }


    func reactivateIfNeeded() {
        // Some interruptions/background transitions deactivate the session.
        // apply() already handles its own errors internally.
        apply()
    }
}
