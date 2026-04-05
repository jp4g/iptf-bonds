use aztec::{
    macros::notes::note,
    oracle::random::random,
    protocol::{
        traits::{Deserialize, Serialize, Packable},
        address::AztecAddress,
    },
};
use poseidon::poseidon2::Poseidon2;


#[derive(Eq, Serialize, Deserialize, Packable)]
#[note]
pub struct ConfigNote {
    pub owner: AztecAddress,
    pub partial_note: Field,
    pub bond_address: AztecAddress,
    pub bond_amount: u128,
    pub payment_token_address: AztecAddress,
    pub payment_amount: u128,
    pub randomness: Field,
}

impl ConfigNote {
    pub fn new(
        owner: AztecAddress,
        partial_note: Field,
        bond_address: AztecAddress,
        bond_amount: u128,
        payment_token_address: AztecAddress,
        payment_amount: u128,
    ) -> Self {
        Self {
            owner,
            partial_note,
            bond_address,
            bond_amount,
            payment_token_address,
            payment_amount,
            // Safety: randomness is non-critical, used for note hiding
            randomness: unsafe { random() }
        }
    }

    pub fn get_nullifier(self, deposit: bool) -> Field {
        let serialized = self.serialize();
        let preimage = serialized.concat([deposit as Field]);
        Poseidon2::hash(preimage, 8)
    }
}
