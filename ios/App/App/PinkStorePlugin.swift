import Foundation
import Capacitor
import StoreKit

// One-time character purchases through Apple's StoreKit. Called from game.js as "PinkStore".
// Apple holds the record of what a family owns, so nothing about the buyer is stored or sent by us.
// Debug builds only: when App Store Connect has no matching product yet, "buy" unlocks locally with
// no charge so the shop can be tried on a device. Release builds contain no such path.
@objc(PinkStorePlugin)
public class PinkStorePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PinkStorePlugin"
    public let jsName = "PinkStore"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "products", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "owned", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "buy", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise)
    ]
    private var updates: Task<Void, Never>?

    override public func load() {
        // Late results, such as an Ask to Buy approval. game.js re-reads "owned" when the app comes back.
        updates = Task.detached {
            for await result in Transaction.updates {
                if case .verified(let transaction) = result { await transaction.finish() }
            }
        }
    }

    deinit { updates?.cancel() }

    @objc func products(_ call: CAPPluginCall) {
        let ids = call.getArray("ids")?.compactMap { $0 as? String } ?? []
        Task {
            let found = (try? await Product.products(for: ids)) ?? []
            var prices: [String: String] = [:]
            for product in found { prices[product.id] = product.displayPrice }
            var testMode = false
            #if DEBUG
            testMode = found.isEmpty
            #endif
            call.resolve(["prices": prices, "testMode": testMode])
        }
    }

    @objc func owned(_ call: CAPPluginCall) {
        Task { call.resolve(["ids": await self.ownedIds()]) }
    }

    @objc func buy(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else { call.resolve(["status": "unavailable"]); return }
        Task {
            do {
                guard let product = try await Product.products(for: [id]).first else {
                    #if DEBUG
                    self.testUnlock(id)
                    call.resolve(["status": "purchased", "test": true])
                    #else
                    call.resolve(["status": "unavailable"])
                    #endif
                    return
                }
                switch try await product.purchase() {
                case .success(let verification):
                    if case .verified(let transaction) = verification {
                        await transaction.finish()
                        call.resolve(["status": "purchased"])
                    } else {
                        call.resolve(["status": "unavailable"])
                    }
                case .pending:
                    call.resolve(["status": "pending"])
                case .userCancelled:
                    call.resolve(["status": "cancelled"])
                @unknown default:
                    call.resolve(["status": "unavailable"])
                }
            } catch {
                call.resolve(["status": "unavailable"])
            }
        }
    }

    @objc func restore(_ call: CAPPluginCall) {
        Task {
            do {
                try await AppStore.sync()
                call.resolve(["ids": await self.ownedIds()])
            } catch {
                call.reject("restore failed")
            }
        }
    }

    private func ownedIds() async -> [String] {
        var ids: [String] = []
        for await result in Transaction.currentEntitlements {
            if case .verified(let transaction) = result, transaction.revocationDate == nil {
                ids.append(transaction.productID)
            }
        }
        #if DEBUG
        ids += UserDefaults.standard.stringArray(forKey: Self.testKey) ?? []
        #endif
        return ids
    }

    #if DEBUG
    private static let testKey = "pinkStoreTestUnlocks"
    private func testUnlock(_ id: String) {
        var ids = UserDefaults.standard.stringArray(forKey: Self.testKey) ?? []
        ids.append(id)
        UserDefaults.standard.set(ids, forKey: Self.testKey)
    }
    #endif
}
