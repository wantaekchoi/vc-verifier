# 크리덴셜 검증

<https://wantaekchoi.github.io/vc-verifier/>

서명된 크리덴셜을 브라우저 안에서 검증하고 무엇을 무엇과 맞춰서 그렇게 판정했는지 보여준다.

## 눌러보기

| 판정 | 넣은 것 |
|---|---|
| [통과](https://wantaekchoi.github.io/vc-verifier/?vc=https://wantaekchoi.github.io/vc-verifier/samples/genuine.json) | 정상 크리덴셜 |
| [어긋남](https://wantaekchoi.github.io/vc-verifier/?vc=https://wantaekchoi.github.io/vc-verifier/samples/tampered.json) | 증거를 한 줄 바꿔치기한 것 |
| [판정 안 함](https://wantaekchoi.github.io/vc-verifier/?vc=https://wantaekchoi.github.io/vc-verifier/samples/unsupported.json) | 다루지 않는 서명 방식 |
| [판정 못 함](https://wantaekchoi.github.io/vc-verifier/?vc=https://wantaekchoi.github.io/vc-verifier/samples/no-fragment.json) | 맞춰보는 데 필요한 것이 빠진 것 |
| [읽지 못했다](https://wantaekchoi.github.io/vc-verifier/?vc=https://wantaekchoi.github.io/vc-verifier/samples/no-proof.json) | 서명이 아예 없는 문서 |
| [통과](https://wantaekchoi.github.io/vc-verifier/?vc=https://wantaekchoi.github.io/vc-verifier/samples/genuine.svg) | 배지 이미지(SVG)에 구워진 크리덴셜 |

"판정 안 함"과 "판정 못 함"을 실패로 접지 않는 것이 요점이다. 모르는 것을 통과로 보이게 하면 검증기일 이유가 없고 못 다룬 것을 실패로 보이게 하면 멀쩡한 크리덴셜을 가짜로 만든다.

## 내 것 넣기

주소·붙여넣기·파일·배지 이미지 네 가지로 받는다. 주소는 링크로도 된다.

```
https://wantaekchoi.github.io/vc-verifier/?vc=<크리덴셜 주소>
```

주소로 받을 때만 상대 서버가 브라우저 요청을 허락해야 한다. 막히면 붙여넣기나 파일로 넣으면 되고 결과는 같다.

## 서명 방식 더하기

`src/core/suites.js`의 배열에 항목 하나를 넣는다. 검증 흐름은 건드리지 않는다.

```js
{
  id: 'ecdsa-rdfc-2019',
  label: 'ECDSA 서명 · RDF 정규화',
  match: (proof) => proof?.cryptosuite === 'ecdsa-rdfc-2019',
  make: () => new DataIntegrityProof({ cryptosuite: ecdsaRdfc2019 }),
}
```

## 개발

```
npm install
npm run check     # 위 여섯 경우가 기대한 판정을 내는지
npm run build     # dist/ 생성
npm run serve     # 빌드 후 localhost:8080
```

`npm run check`는 배포 게이트다. 하나라도 기대와 다르면 배포가 멈춘다.

## 폰트

제목은 나눔명조(Copyright 2010, NHN Corporation) 서브셋이다. SIL Open Font License 1.1, 전문은 [fonts/OFL.txt](fonts/OFL.txt).
