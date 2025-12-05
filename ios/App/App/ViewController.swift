//
//  ViewController.swift
//  App
//
//  Created by Jeremy Smith on 12/4/25.
//

import UIKit
import Capacitor

class ViewController: CAPBridgeViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        print("🍧 ViewController.viewDidLoad – native shell is live")
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()

        // Grab Capacitor’s web view
        guard let webView = self.webView else {
            print("⚠️ webView is nil – cannot layout SnowCone shell.")
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
