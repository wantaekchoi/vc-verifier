# Credential check

<https://wantaekchoi.github.io/vc-verifier/>

Checks whether a signed credential holds up, and shows what it matched against to get there.

## Try it

| Verdict | What went in |
|---|---|
| [PASS](https://wantaekchoi.github.io/vc-verifier/?vc=https://wantaekchoi.github.io/vc-verifier/samples/genuine.json) | an Open Badges 3.0 credential |
| [PASS](https://wantaekchoi.github.io/vc-verifier/?vc=https://wantaekchoi.github.io/vc-verifier/samples/plain-vc.json) | a plain W3C VC with no Open Badges vocabulary |
| [PASS](https://wantaekchoi.github.io/vc-verifier/?vc=https://wantaekchoi.github.io/vc-verifier/samples/genuine.svg) | a credential baked into an SVG badge |
| [MISMATCH](https://wantaekchoi.github.io/vc-verifier/?vc=https://wantaekchoi.github.io/vc-verifier/samples/tampered.json) | one evidence entry swapped after signing |
| [NOT JUDGED](https://wantaekchoi.github.io/vc-verifier/?vc=https://wantaekchoi.github.io/vc-verifier/samples/unsupported.json) | a cryptosuite this verifier does not implement |
| [CANNOT JUDGE](https://wantaekchoi.github.io/vc-verifier/?vc=https://wantaekchoi.github.io/vc-verifier/samples/no-fragment.json) | verificationMethod that names no single key |
| [CANNOT JUDGE](https://wantaekchoi.github.io/vc-verifier/?vc=https://raw.githubusercontent.com/w3c/vc-di-eddsa/main/TestVectors/eddsa-rdfc-2022/signedDataInt.json) | a W3C test vector whose JSON-LD context is not bundled here |
| [UNREADABLE](https://wantaekchoi.github.io/vc-verifier/?vc=https://wantaekchoi.github.io/vc-verifier/samples/no-proof.json) | a document with no proof attached |

NOT JUDGED and CANNOT JUDGE are not failures. Calling a credential broken because this verifier could not read it would turn a sound credential into a fake one; calling it a pass would make the verifier pointless.

## Your own credential

Four ways in: address, paste, file, badge image. The address route also works as a link.

```
https://wantaekchoi.github.io/vc-verifier/?vc=<credential address>
```

Only that route needs the other server to allow a browser request. Pasting and files do not, and the result is the same.

## Another signature suite

Add one entry to the array in `src/core/suites.js`. The verification flow stays untouched.

```js
{
  id: 'ecdsa-rdfc-2019',
  label: 'ECDSA signature · RDF canonicalisation',
  match: (proof) => proof?.cryptosuite === 'ecdsa-rdfc-2019',
  make: () => new DataIntegrityProof({ cryptosuite: ecdsaRdfc2019 }),
}
```

## Development

```
npm install
npm run check     # do the bundled samples reach the verdicts they should
npm run build     # writes dist/
npm run serve     # build, then localhost:8080
```

`npm run check` gates deployment. One case off its expected verdict and nothing ships.

## Font

Headings use a subset of Nanum Myeongjo (Copyright 2010, NHN Corporation), SIL Open Font License 1.1. Full text in [fonts/OFL.txt](fonts/OFL.txt).
