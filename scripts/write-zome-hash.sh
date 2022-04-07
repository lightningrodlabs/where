# Compute hash of where zome
value=`./hash_zome ./target/wasm32-unknown-unknown/release/where.wasm`
echo "$value" > dna/where_zome_hash.txt
echo
echo "     WHERE ZOME HASH = $value"

# Compute hash of ludotheque zome
value=`./hash_zome ./target/wasm32-unknown-unknown/release/where_ludotheque.wasm`
echo "$value" > dna/ludotheque_zome_hash.txt
echo
echo "LUDOTHEQUE ZOME HASH = $value"