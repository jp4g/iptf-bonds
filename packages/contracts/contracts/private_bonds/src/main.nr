use aztec::macros::aztec;

#[aztec]
pub contract PrivateBonds {
    use aztec::{
        macros::{functions::{authorize_once, external, initializer, only_self}, storage::storage},
        protocol::address::AztecAddress,
        state_vars::{Map, Owned, PublicMutable},
    };
    use aztec::messages::message_delivery::MessageDelivery;
    use aztec::test::helpers::test_environment::TestEnvironment;
    use balance_set::BalanceSet;

    #[storage]
    struct Storage<Context> {
        owner: PublicMutable<AztecAddress, Context>,
        private_balances: Owned<BalanceSet<Context>, Context>,
        whitelist: Map<AztecAddress, PublicMutable<bool, Context>, Context>,
        total_supply: PublicMutable<u128, Context>,
        maturity_date: PublicMutable<u64, Context>,
    }

    #[initializer]
    #[external("private")]
    fn constructor(total_supply: u128, maturity: u64) {
        let issuer = self.msg_sender();

        // Set public state via enqueued calls
        self.enqueue_self._set_owner(issuer);
        self.enqueue_self._set_maturity(maturity);
        self.enqueue_self._set_total_supply(total_supply);

        // Mint entire supply to issuer's private balance
        // This is the ONLY minting that ever happens
        self.storage.private_balances.at(issuer).add(total_supply).deliver(
            MessageDelivery.ONCHAIN_CONSTRAINED,
        );
    }

    #[external("public")]
    #[only_self]
    fn _set_owner(owner: AztecAddress) {
        self.storage.owner.write(owner);
    }

    #[external("public")]
    #[only_self]
    fn _set_maturity(maturity: u64) {
        self.storage.maturity_date.write(maturity);
    }

    #[external("public")]
    #[only_self]
    fn _set_total_supply(total_supply: u128) {
        self.storage.total_supply.write(total_supply);
    }

    #[external("public")]
    fn add_to_whitelist(investor: AztecAddress) {
        assert_eq(
            self.msg_sender(),
            self.storage.owner.read(),
            "Only owner can manage whitelist",
        );
        assert(!self.storage.whitelist.at(investor).read(), "Investor is already listed");

        self.storage.whitelist.at(investor).write(true);
    }

    #[external("public")]
    fn ban_from_whitelist(investor: AztecAddress) {
        assert_eq(
            self.msg_sender(),
            self.storage.owner.read(),
            "Only owner can manage whitelist",
        );
        assert(self.storage.whitelist.at(investor).read(), "Investor is already unlisted");

        self.storage.whitelist.at(investor).write(false);
    }

    #[external("private")]
    fn distribute_private(investor: AztecAddress, amount: u128) {
        // Only issuer can distribute
        self.enqueue_self._assert_is_owner(self.msg_sender());

        // Check investor is whitelisted
        self.enqueue_self._assert_is_whitelisted(investor);

        // Transfer from issuer's private balance to investor
        let issuer = self.msg_sender();
        self.storage.private_balances.at(issuer).sub(amount).deliver(
            MessageDelivery.ONCHAIN_CONSTRAINED,
        );
        self.storage.private_balances.at(investor).add(amount).deliver(
            MessageDelivery.ONCHAIN_CONSTRAINED,
        );
    }

    #[external("private")]
    fn transfer_private(to: AztecAddress, amount: u128) {
        let sender = self.msg_sender();

        // Check both sender and recipient are whitelisted
        self.enqueue_self._assert_is_whitelisted(sender);
        self.enqueue_self._assert_is_whitelisted(to);

        // Spend sender's notes
        self.storage.private_balances.at(sender).sub(amount).deliver(
            MessageDelivery.ONCHAIN_CONSTRAINED,
        );

        // Create new notes for recipient
        self.storage.private_balances.at(to).add(amount).deliver(
            MessageDelivery.ONCHAIN_CONSTRAINED,
        );
    }

    /// Delegated transfer for DvP and other authorized scenarios.
    /// Requires `from` to have created an authwit for this exact call.
    #[authorize_once("from", "authwit_nonce")]
    #[external("private")]
    fn transfer_from(from: AztecAddress, to: AztecAddress, amount: u128, authwit_nonce: Field) {
        self.enqueue_self._assert_is_whitelisted(from);
        self.enqueue_self._assert_is_whitelisted(to);

        self.storage.private_balances.at(from).sub(amount).deliver(
            MessageDelivery.ONCHAIN_CONSTRAINED,
        );
        self.storage.private_balances.at(to).add(amount).deliver(
            MessageDelivery.ONCHAIN_CONSTRAINED,
        );
    }

    /// Redeem bonds at maturity. Investor burns their bonds directly.
    #[external("private")]
    fn redeem(amount: u128) {
        let investor = self.msg_sender();
        self.enqueue_self._assert_is_whitelisted(investor);
        self.enqueue_self._assert_maturity_reached();

        self.storage.private_balances.at(investor).sub(amount).deliver(
            MessageDelivery.ONCHAIN_CONSTRAINED,
        );
    }

    #[external("public")]
    fn transfer_ownership(new_owner: AztecAddress) {
        assert_eq(
            self.msg_sender(),
            self.storage.owner.read(),
            "Only current owner can transfer ownership",
        );
        self.storage.owner.write(new_owner);
    }

    #[external("utility")]
    unconstrained fn private_balance_of(owner: AztecAddress) -> pub u128 {
        self.storage.private_balances.at(owner).balance_of()
    }

    #[external("utility")]
    unconstrained fn get_total_supply() -> pub u128 {
        self.storage.total_supply.read()
    }

    #[external("utility")]
    unconstrained fn get_maturity_date() -> pub u64 {
        self.storage.maturity_date.read()
    }

    #[external("utility")]
    unconstrained fn is_whitelisted(address: AztecAddress) -> pub bool {
        self.storage.whitelist.at(address).read()
    }

    #[external("public")]
    #[only_self]
    fn _assert_is_owner(address: AztecAddress) {
        assert_eq(address, self.storage.owner.read(), "Only the Issuer can perform this action");
    }

    #[external("public")]
    #[only_self]
    fn _assert_is_whitelisted(address: AztecAddress) {
        assert(self.storage.whitelist.at(address).read(), "Address is not whitelisted");
    }

    #[external("public")]
    #[only_self]
    fn _assert_maturity_reached() {
        let block_timestamp = self.context.timestamp();
        let maturity_date = self.storage.maturity_date.read();
        assert(block_timestamp >= maturity_date, "Bond has not reached maturity yet");
    }

    #[test]
    unconstrained fn test_initialize_and_balance() {
        let mut env = TestEnvironment::new();
        let issuer = env.create_light_account();

        let bond_addr = env.deploy("PrivateBonds").with_private_initializer(
            issuer,
            PrivateBonds::interface().constructor(1_000_000, 0),
        );

        let balance: u128 =
            env.execute_utility(PrivateBonds::at(bond_addr).private_balance_of(issuer));
        assert_eq(balance, 1_000_000);
    }

}
