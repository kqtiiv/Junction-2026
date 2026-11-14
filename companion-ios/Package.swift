// swift-tools-version:5.9
// CompanionCore: everything in the iOS companion that does not need the Meta DAT SDK.
// The app target (App/, created once in Xcode) adds the DAT SDK and DATGlassesBridge.
import PackageDescription

let package = Package(
    name: "CompanionCore",
    platforms: [.iOS("17.2"), .macOS(.v14)],
    products: [
        .library(name: "CompanionCore", targets: ["Contracts", "CompanionCore"]),
        .library(name: "CompanionUI", targets: ["CompanionUI"]),
        .executable(name: "companion-smoke", targets: ["CompanionSmoke"]),
    ],
    targets: [
        // Generated from contracts/schemas by contracts/scripts/generate.mjs; copied by scripts/sync-contracts.sh.
        .target(name: "Contracts"),
        .target(name: "CompanionCore", dependencies: ["Contracts"]),
        // SwiftUI views, audio session, speech in/out. Compiles only where those frameworks exist (iOS/macOS).
        .target(name: "CompanionUI", dependencies: ["CompanionCore", "Contracts"]),
        // End-to-end check of the client against a running backend: `swift run companion-smoke`.
        .executableTarget(name: "CompanionSmoke", dependencies: ["CompanionCore", "Contracts"]),
        .testTarget(name: "CompanionCoreTests", dependencies: ["CompanionCore", "Contracts"]),
    ]
)
