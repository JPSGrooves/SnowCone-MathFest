//
//  ViewController.swift
//  App
//
//  Created by Jeremy Smith on 12/4/25.
//

import UIKit
import Capacitor
import WebKit   // for WKWebView / evaluateJavaScript

class ViewController: CAPBridgeViewController {

    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()
        print("🍧🍧🍧 [SCMF] ViewController.viewDidLoad – native shell is LIVE 🍧🍧🍧")

        // First chance to tell the web app it's running inside native iOS shell
        injectIOSNativeFlag()
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)

        // Second chance – in case the webView was recreated or attached later
        print("🔁 [SCMF] ViewController.viewDidAppear – reinjecting SC_IOS_NATIVE just in case")
        injectIOSNativeFlag()
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
