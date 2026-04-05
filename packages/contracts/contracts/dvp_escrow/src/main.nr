use aztec::macros::aztec;

pub mod types;

#[aztec]
pub contract DvPEscrow {
    // imports
    use aztec::{
        macros::{
            functions::{initializer, external},
            storage::storage
        },
        messages::message_delivery::MessageDelivery,
        protocol::address::AztecAddress,
        state_vars::SinglePrivateImmutable
    };
    use token_contract::Token;
    use private_bonds::PrivateBonds;
    use crate::types::config_note::ConfigNote;


    #[storage]
    struct Storage<Context> {
        config: SinglePrivateImmutable<ConfigNote, Context>,
    }

    #[external("private")]
    #[initializer]
    fn constructor(
        bond_address: AztecAddress,
        bond_amount: u128,
        payment_token_address: AztecAddress,
        payment_amount: u128,
    ) {

        // create partial note for the payment token (buy side)
        let partial_note = self.call(Token::at(payment_token_address)
            .initialize_transfer_commitment(
                self.msg_sender(),
                self.address
            ));

        // Create config note
        let config = ConfigNote::new(
            self.address,
            partial_note,
            bond_address,
            bond_amount,
            payment_token_address,
            payment_amount
        );

        self.storage.config
            .initialize(config)
            .deliver(MessageDelivery.ONCHAIN_CONSTRAINED);
    }

    /// Seller locks bond delivery into escrow.
    /// Requires seller to have created an authwit for PrivateBonds::transfer_from.
    #[external("private")]
    fn lock_delivery(_nonce: Field) {
        let config = self.storage.config.get_note();
        let caller = self.msg_sender();

        // transfer bonds from seller into escrow via transfer_from
        self.call(PrivateBonds::at(config.bond_address)
            .transfer_from(
                caller,
                self.address,
                config.bond_amount,
                _nonce
            ));

        // emit nullifier to prevent multiple deposits
        let deposit_nullifier = self.storage.config.get_note().get_nullifier(true);
        self.context.push_nullifier(deposit_nullifier);
    }

    /// Buyer settles by paying stablecoins and receiving bonds.
    /// Requires buyer to have created an authwit for Token::transfer_private_to_private.
    #[external("private")]
    fn settle(_nonce: Field) {
        let config = self.storage.config.get_note();
        let caller = self.msg_sender();

        // transfer payment tokens from buyer into escrow
        self.call(Token::at(config.payment_token_address)
            .transfer_private_to_private(
                caller,
                self.address,
                config.payment_amount,
                _nonce
            ));

        // finalize the partial note - payment tokens go to the seller
        self.call(Token::at(config.payment_token_address)
            .transfer_private_to_commitment(
                self.address,
                config.partial_note,
                config.payment_amount,
                0
            ));

        // transfer bonds from escrow to buyer
        self.call(PrivateBonds::at(config.bond_address)
            .transfer_from(
                self.address,
                caller,
                config.bond_amount,
                0
            ));

        // emit nullifier to prevent multiple fills
        let fill_nullifier = config.get_nullifier(false);
        self.context.push_nullifier(fill_nullifier);
    }

    #[external("utility")]
    unconstrained fn get_config() -> ConfigNote {
       self.storage.config.view_note()
    }
}
