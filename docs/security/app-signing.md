# Ed25519 package signatures v1

Every non-directory ZIP entry except signature/signature.json participates in a
canonical digest. Validate archive paths/duplicates/size/link rules first. Sort
entries by their ASCII path. Hash each uncompressed file with SHA-256. Hash this
UTF-8 representation (LF endings, decimal byte lengths):

```text
usecloud-content-v1\n
<lowercase file SHA256> <decimal size> <path>\n
...
```

The signature message is exactly these LF-terminated lines:

```text
usecloud-signature-v1
<canonical content digest>
<SHA256 fingerprint of raw public key>
<standard-base64 UTF-8 publisher ID>
<standard-base64 UTF-8 publisher name>
```

Ed25519 signs those bytes. signature.json has formatVersion=1, algorithm=Ed25519,
keyId, raw publicKey/base64, publisherId, publisherName, digest and signature/base64.
Unknown signature entries/fields, invalid keys/signatures and changed contents
are rejected, not treated as unsigned. Compression/timestamps are not the signed
representation. No private key is included. There is no home-grown crypto scheme:
Go crypto/ed25519, crypto/rand, SHA-256 and PKCS#8 are used.

Exact developer commands, from repository root:

```bash
go run ./core/backend/cmd/usecloud app keygen /private/path/dev.pkcs8
go run ./core/backend/cmd/usecloud app public-key /private/path/dev.pkcs8
go run ./core/backend/cmd/usecloud app sign artifacts/files-0.2.0.usecloud /private/path/dev.pkcs8 my-publisher 'My publisher'
go run ./core/backend/cmd/usecloud app verify artifacts/files-0.2.0.usecloud
```

Parent directory must already exist. Keys are created exclusively with mode0600;
reading a group/world-readable key is refused. Back up keys privately, never
commit them. verify proves integrity, not platform trust. To trust a publisher,
add its public record via Settings → Users → Publisher trust or the authenticated
admin POST /api/v1/publishers API after independently checking its fingerprint.

make app-files-pack signs with a locally generated /data/platform/keys key and
adds an explicitly LOCAL development trust anchor. Containers uses the same
workflow. This is not an official production publisher identity or remote PKI.
