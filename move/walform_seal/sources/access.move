module walform_seal::access {
    use sui::event;

    /// An allowlist that controls who can decrypt Seal-encrypted data.
    /// The form owner creates this when enabling encryption on a form.
    public struct Allowlist has key, store {
        id: UID,
        /// Addresses allowed to decrypt
        addresses: vector<address>,
    }

    /// Emitted when an allowlist is created
    public struct AllowlistCreated has copy, drop {
        id: ID,
        creator: address,
    }

    /// Create a new allowlist. The creator is automatically added.
    public fun create(ctx: &mut TxContext): Allowlist {
        let sender = ctx.sender();
        let list = Allowlist {
            id: object::new(ctx),
            addresses: vector[sender],
        };
        event::emit(AllowlistCreated {
            id: object::id(&list),
            creator: sender,
        });
        list
    }

    /// Create and transfer to sender
    entry fun new_allowlist(ctx: &mut TxContext) {
        let list = create(ctx);
        transfer::transfer(list, ctx.sender());
    }

    /// Add an address to the allowlist. Only the object owner can call this
    /// since the Allowlist must be passed by value (owned object).
    entry fun add_address(list: &mut Allowlist, addr: address) {
        if (!list.addresses.contains(&addr)) {
            list.addresses.push_back(addr);
        };
    }

    /// Remove an address from the allowlist.
    entry fun remove_address(list: &mut Allowlist, addr: address) {
        let (found, idx) = list.addresses.index_of(&addr);
        if (found) {
            list.addresses.remove(idx);
        };
    }

    /// Seal approval function. Key servers call this to verify access.
    /// The `id` parameter is the identity bytes used during encryption.
    /// Access is granted if the transaction sender is in the allowlist.
    entry fun seal_approve(id: vector<u8>, list: &Allowlist, ctx: &TxContext) {
        // Verify the id namespace matches this allowlist
        let list_id = object::id(list);
        let list_id_bytes = list_id.to_bytes();
        // The identity should start with the allowlist object ID
        assert!(starts_with(&id, &list_id_bytes), 0);
        // Verify caller is in the allowlist
        assert!(list.addresses.contains(&ctx.sender()), 1);
    }

    fun starts_with(haystack: &vector<u8>, needle: &vector<u8>): bool {
        if (needle.length() > haystack.length()) {
            return false
        };
        let mut i = 0;
        while (i < needle.length()) {
            if (haystack[i] != needle[i]) {
                return false
            };
            i = i + 1;
        };
        true
    }
}
