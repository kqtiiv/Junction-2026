// The pitch moment, end to end in the iOS Simulator with Meta's Mock Device Kit:
// consent → connect (simulated) glasses → "does this fit my week?" → answer card → confirm.
// Screenshots are attached to the test result, so the flow can be seen without a Mac.
// Needs the backend on http://localhost:8787 (CI starts it).
import XCTest

final class CompanionUITests: XCTestCase {
    override func setUp() { continueAfterFailure = false }

    func testPriceLabelFlowWithSimulatedGlasses() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-uiTesting"]
        app.launch()

        let allow = app.buttons["allowConsent"]
        XCTAssertTrue(allow.waitForExistence(timeout: 30), "consent screen")
        screenshot(app, "1-consent")
        allow.tap()

        let menu = app.buttons["menu"]
        XCTAssertTrue(menu.waitForExistence(timeout: 20), "main screen with the menu")
        menu.tap()
        app.buttons["connectGlasses"].tap()
        XCTAssertTrue(element(app, containing: "mode: glasses").waitForExistence(timeout: 45), "simulated glasses connected")
        XCTAssertTrue(element(app, containing: "glasses: mock").exists, "the mock is never hidden")
        screenshot(app, "2-glasses-connected")

        let field = app.textFields["askField"]
        field.tap()
        field.typeText("does this fit my week\n")
        XCTAssertTrue(element(app, containing: "Langattomat kuulokkeet").waitForExistence(timeout: 45), "answer card, titled with the item")
        screenshot(app, "3-answer")

        // The Purchase Receipt (DEC-029): open it and have the backend re-check it independently.
        let receipt = app.buttons["openReceipt"].firstMatch
        XCTAssertTrue(receipt.waitForExistence(timeout: 10), "receipt link on the answer card")
        for _ in 0..<4 where !receipt.isHittable { app.scrollViews.firstMatch.swipeUp() }
        receipt.tap()
        let check = app.buttons["checkReceipt"]
        XCTAssertTrue(check.waitForExistence(timeout: 10), "receipt sheet")
        screenshot(app, "4-receipt")
        app.swipeUp()
        check.tap()
        XCTAssertTrue(element(app, containing: "Verified just now").waitForExistence(timeout: 20), "the receipt verifies against the backend")
        screenshot(app, "5-receipt-verified")
        app.buttons["closeReceipt"].tap()

        let confirm = app.buttons["confirmProposal"]
        XCTAssertTrue(confirm.waitForExistence(timeout: 15), "decision panel")
        screenshot(app, "6-decision")
        confirm.tap()
        XCTAssertTrue(element(app, containing: "Done.").waitForExistence(timeout: 20), "plan confirmed")
        // The stale answer card is replaced by the updated week (review fix).
        XCTAssertTrue(element(app, containing: "Safe to spend this week").waitForExistence(timeout: 10), "updated card shown")
        XCTAssertFalse(element(app, containing: "Langattomat kuulokkeet").exists, "stale answer card replaced")
        screenshot(app, "7-confirmed")
    }

    private func element(_ app: XCUIApplication, containing text: String) -> XCUIElement {
        app.descendants(matching: .any).matching(NSPredicate(format: "label CONTAINS %@", text)).firstMatch
    }

    private func screenshot(_ app: XCUIApplication, _ name: String) {
        let a = XCTAttachment(screenshot: app.screenshot())
        a.name = name
        a.lifetime = .keepAlways
        add(a)
    }
}
