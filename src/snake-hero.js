import * as THREE from 'three'
import { gsap } from 'gsap'

// ------------------------------------------------------------------
// Snake hero. One pinned full-screen stage: a WebGL snake holds the
// centre column, the two role blocks sit either side, and the About
// intro opens through the ring the snake closes into.
//
// Scroll phases: 01 Coil, 02 Rise, 03 Charge, 04 Ouroboros.
// ScrollTrigger is already wired to Lenis in main.js, so the pinned
// timeline below scrubs off Lenis's smoothed scroll.
// ------------------------------------------------------------------

export function initSnakeHero({ reduceMotion = false } = {}) {
  const hero = document.getElementById('hero')
  const canvas = document.getElementById('gl')
  const portal = document.getElementById('portal')
  if (!hero || !canvas || !portal) return null

  const root = document.documentElement
  const narrow = window.matchMedia('(max-width: 820px)')
  const css = getComputedStyle(root)
  const cssColor = (name, fallback) => css.getPropertyValue(name).trim() || fallback

  /* ---------- scroll-driven state ---------- */
  // lift: the coil starts a little low to leave room for the greeting above it
  const S = { ab: 0, bc: 0, charge: 0, dark: 0, tiltX: -0.8, rotZ: -0.35, scale: 1.18, lift: -0.12, spin: 0, portal: 0, dolly: 0 }

  /* ---------- renderer ---------- */
  let renderer = null
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  } catch (e) {
    // no WebGL: the glyph carries the stage on its own
    hero.classList.add('hero--static')
  }
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
  let baseZ = 9
  let W = 1
  let H = 1

  const group = new THREE.Group()
  scene.add(group)

  /* ---------- snake body: three poses sampled on the same rings ---------- */
  const N = 300
  const RAD = 22
  const R = 0.17
  const HEAD0 = 0.93
  const HEADL = 0.07
  const ss = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)
  }
  const ringT = new Float32Array(N + 1)
  for (let i = 0; i <= N; i++) ringT[i] = 1 - Math.pow(1 - i / N, 1.6) // denser rings toward the head
  const V = (x, y, z) => new THREE.Vector3(x, y, z)

  function sample(points) {
    const c = new THREE.CatmullRomCurve3(points, false, 'centripetal')
    c.arcLengthDivisions = 1200
    const out = new Float32Array(3 * (N + 1))
    const p = new THREE.Vector3()
    for (let i = 0; i <= N; i++) {
      c.getPointAt(ringT[i], p)
      out[3 * i] = p.x
      out[3 * i + 1] = p.y
      out[3 * i + 2] = p.z
    }
    return out
  }
  // A: coiled, head lifted over the coils
  const pa = []
  for (let i = 0; i <= 40; i++) {
    const u = i / 40
    const th = -Math.PI / 2 + u * 1.7 * 2 * Math.PI
    const r = 1.75 - 1.15 * u
    pa.push(V(Math.cos(th) * r, Math.sin(th) * r, 0))
  }
  pa.push(V(-0.66, -0.12, 0.1), V(-0.62, -0.45, 0.27), V(-0.46, -0.8, 0.4), V(-0.26, -1.1, 0.42), V(-0.12, -1.46, 0.37))
  // B: risen S, seen from above
  const pb = []
  for (let i = 0; i <= 40; i++) {
    const u = i / 40
    pb.push(
      V(
        Math.sin(u * Math.PI * 3.6 + 0.4) * 0.95 * (1 - 0.55 * u),
        -2.3 + 4.2 * u,
        0.2 + 0.16 * Math.sin(u * Math.PI * 2.2) + 0.4 * ss(0.75, 1, u)
      )
    )
  }
  // C: ring, head closing on the tail
  const RING = 1.6
  const pc = []
  for (let i = 0; i <= 48; i++) {
    const u = i / 48
    const th = -Math.PI / 2 + 0.1 + u * 2 * Math.PI * 0.965
    pc.push(V(Math.cos(th) * RING, Math.sin(th) * RING, 0.1 * Math.sin(u * Math.PI)))
  }
  const A = sample(pa)
  const B = sample(pb)
  const C = sample(pc)

  function profile(t, out) {
    let w = R * (0.05 + 0.95 * Math.pow(ss(0, 0.5, t), 0.8))
    let h = w * 0.92
    const neck = ss(0.86, HEAD0, t)
    w *= 1 - 0.2 * neck
    h *= 1 - 0.13 * neck
    if (t > HEAD0) {
      const u = (t - HEAD0) / HEADL
      const cap = u > 0.8 ? Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.8) / 0.2, 2))) : 1
      w = R * (0.8 + 0.62 * ss(0, 0.4, u) - 0.74 * ss(0.4, 1, u)) * cap
      h = R * (0.8 + 0.16 * ss(0, 0.4, u) - 0.46 * ss(0.4, 1, u)) * cap
    }
    out[0] = w
    out[1] = h
  }
  const prof = new Float32Array(2 * (N + 1))
  {
    const o = [0, 0]
    for (let i = 0; i <= N; i++) {
      profile(ringT[i], o)
      prof[2 * i] = o[0]
      prof[2 * i + 1] = o[1]
    }
  }

  const vCount = (N + 1) * (RAD + 1)
  const pos = new Float32Array(vCount * 3)
  const nor = new Float32Array(vCount * 3)
  const uv = new Float32Array(vCount * 2)
  const ta = new Float32Array(vCount * 2)
  const idx = []
  const COS = new Float32Array(RAD + 1)
  const SIN = new Float32Array(RAD + 1)
  for (let j = 0; j <= RAD; j++) {
    COS[j] = Math.cos((j / RAD) * 2 * Math.PI)
    SIN[j] = Math.sin((j / RAD) * 2 * Math.PI)
  }
  for (let i = 0; i <= N; i++)
    for (let j = 0; j <= RAD; j++) {
      const v = i * (RAD + 1) + j
      uv[2 * v] = ringT[i]
      uv[2 * v + 1] = j / RAD
      ta[2 * v] = ringT[i]
      ta[2 * v + 1] = j / RAD
      if (i < N && j < RAD) {
        const a = v
        const b = v + RAD + 1
        const c = v + 1
        const d = b + 1
        idx.push(a, b, c, b, d, c)
      }
    }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage))
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3).setUsage(THREE.DynamicDrawUsage))
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  geo.setAttribute('aTA', new THREE.BufferAttribute(ta, 2))
  geo.setIndex(idx)

  /* ---------- scale relief texture ---------- */
  function scaleTexture() {
    const s = 256
    const c = document.createElement('canvas')
    c.width = c.height = s
    const g = c.getContext('2d')
    g.fillStyle = '#000'
    g.fillRect(0, 0, s, s)
    const dx = 64
    const dy = 32
    const a = 46
    const b = 21
    for (let col = 5; col >= -1; col--)
      for (let row = -1; row <= 8; row++) {
        const cx = col * dx + (row & 1 ? dx / 2 : 0)
        const cy = row * dy
        const gr = g.createLinearGradient(cx - a, 0, cx + a, 0)
        gr.addColorStop(0, '#fff')
        gr.addColorStop(0.45, '#b9b9b9')
        gr.addColorStop(1, '#3a3a3a')
        g.beginPath()
        g.moveTo(cx - a, cy)
        g.quadraticCurveTo(cx - a * 0.25, cy - b * 1.05, cx + a, cy - b * 0.2)
        g.lineTo(cx + a, cy + b * 0.2)
        g.quadraticCurveTo(cx - a * 0.25, cy + b * 1.05, cx - a, cy)
        g.closePath()
        g.fillStyle = gr
        g.fill()
        g.lineWidth = 1.3
        g.strokeStyle = '#000'
        g.stroke()
      }
    const t = new THREE.CanvasTexture(c)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(36, 3)
    t.anisotropy = 8
    return t
  }
  const relief = scaleTexture()

  const uniforms = { uCharge: { value: 0 }, uTime: { value: 0 } }
  const skin = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.36,
    metalness: 0.0,
    clearcoat: 0.85,
    clearcoatRoughness: 0.22,
    bumpMap: relief,
    bumpScale: 0.022,
    envMapIntensity: 0.6,
  })
  skin.onBeforeCompile = sh => {
    sh.uniforms.uCharge = uniforms.uCharge
    sh.uniforms.uTime = uniforms.uTime
    sh.vertexShader =
      'attribute vec2 aTA;\nvarying vec2 vTA;\n' +
      sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vTA = aTA;')
    sh.fragmentShader =
      'uniform float uCharge;\nuniform float uTime;\nvarying vec2 vTA;\nfloat sChg;float sBand;float sMark;float sSeam;\n' +
      sh.fragmentShader
        .replace(
          '#include <map_fragment>',
          `#include <map_fragment>
        float sc = texture2D( bumpMap, vUv ).r;
        float phi = vTA.y * 6.2831853; float sn = sin(phi); float cs = cos(phi);
        float belly = smoothstep(-0.30, -0.75, sn);
        float dd = abs(fract(vTA.x * 22.0) - 0.5) * 2.0;
        float edge = dd * 0.85 + abs(cs) * 1.15;
        float top = smoothstep(0.0, 0.15, sn);
        float msk = smoothstep(0.04, 0.10, vTA.x) * (1.0 - smoothstep(0.895, 0.925, vTA.x));
        float dia = (1.0 - smoothstep(0.44, 0.48, edge)) * top * msk;
        float rim = (smoothstep(0.44, 0.48, edge) - smoothstep(0.55, 0.59, edge)) * top * msk;
        vec3 ink = vec3(0.012, 0.013, 0.017), red = vec3(0.62, 0.030, 0.018), bone = vec3(0.80, 0.76, 0.68);
        vec3 base = mix(ink, red, dia); base = mix(base, bone * 0.85, rim * 0.9); base = mix(base, bone, belly);
        base *= 0.40 + 0.70 * sc;
        float front = 1.0 - uCharge * 1.14;
        sChg = smoothstep(front, front + 0.03, vTA.x) * step(0.0005, uCharge);
        sBand = sChg * (1.0 - smoothstep(front + 0.03, front + 0.10, vTA.x));
        sMark = dia + rim; sSeam = pow(1.0 - sc, 5.0);
        base = mix(base, vec3(0.010, 0.014, 0.028), sChg * 0.93);
        diffuseColor.rgb = base;`
        )
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
        float pulse = 0.55 + 0.45 * sin(vTA.x * 70.0 - uTime * 5.0);
        totalEmissiveRadiance += sChg * vec3(0.22, 0.60, 1.0) * (sSeam * 1.5 * pulse + sMark * 1.6) + sBand * vec3(0.75, 0.92, 1.0) * 2.6;`
        )
  }
  const snake = new THREE.Mesh(geo, skin)
  snake.frustumCulled = false
  snake.castShadow = true
  group.add(snake)

  /* ---------- eyes, tongue ---------- */
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1, emissive: 0xffa21a, emissiveIntensity: 1.0 })
  const eyeGeo = new THREE.SphereGeometry(0.043, 16, 12)
  const eyes = [new THREE.Mesh(eyeGeo, eyeMat), new THREE.Mesh(eyeGeo, eyeMat)]
  eyes.forEach(e => group.add(e))
  const tShape = new THREE.Shape()
  tShape.moveTo(-0.012, 0)
  tShape.lineTo(-0.012, 0.2)
  tShape.lineTo(-0.06, 0.34)
  tShape.lineTo(0, 0.24)
  tShape.lineTo(0.06, 0.34)
  tShape.lineTo(0.012, 0.2)
  tShape.lineTo(0.012, 0)
  tShape.closePath()
  const shu = cssColor('--shu', '#e0402a')
  const tongueMat = new THREE.MeshBasicMaterial({ color: shu, side: THREE.DoubleSide })
  const tongue = new THREE.Mesh(new THREE.ShapeGeometry(tShape), tongueMat)
  tongue.matrixAutoUpdate = false
  group.add(tongue)
  const iEye = Math.round((1 - Math.pow(1 - (HEAD0 + 0.52 * HEADL), 1 / 1.6)) * N)

  /* ---------- glow, sparks, lightning (the charge) ---------- */
  function dot() {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const g = c.getContext('2d')
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    gr.addColorStop(0, 'rgba(255,255,255,1)')
    gr.addColorStop(0.25, 'rgba(160,215,255,0.55)')
    gr.addColorStop(1, 'rgba(60,140,255,0)')
    g.fillStyle = gr
    g.fillRect(0, 0, 128, 128)
    return new THREE.CanvasTexture(c)
  }
  const dotTex = dot()
  const mkSprite = sc => {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: dotTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 })
    )
    s.scale.setScalar(sc)
    group.add(s)
    return s
  }
  const frontGlow = mkSprite(1.15)
  const eyeGlow = [mkSprite(0.42), mkSprite(0.42)]

  const SP = 170
  const spPos = new Float32Array(SP * 3)
  const spSeed = new Float32Array(SP * 5)
  for (let i = 0; i < SP * 5; i++) spSeed[i] = Math.random()
  const spGeo = new THREE.BufferGeometry()
  spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3).setUsage(THREE.DynamicDrawUsage))
  const sparks = new THREE.Points(
    spGeo,
    new THREE.PointsMaterial({
      map: dotTex,
      size: 0.085,
      color: 0xbfe2ff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  )
  sparks.frustumCulled = false
  group.add(sparks)

  const BOLTS = 7
  const SEG = 9
  const boltPos = new Float32Array(BOLTS * SEG * 6)
  const boltGeo = new THREE.BufferGeometry()
  boltGeo.setAttribute('position', new THREE.BufferAttribute(boltPos, 3).setUsage(THREE.DynamicDrawUsage))
  const bolts = new THREE.LineSegments(
    boltGeo,
    new THREE.LineBasicMaterial({ color: 0xd4ecff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
  )
  bolts.frustumCulled = false
  group.add(bolts)
  let boltClock = 0
  function strike(ox, oy, oz) {
    let k = 0
    for (let b = 0; b < BOLTS; b++) {
      let x = ox
      let y = oy
      let z = oz
      const ang = Math.random() * Math.PI * 2
      const len = 0.5 + Math.random() * 1.1
      const dx = Math.cos(ang)
      const dy = Math.sin(ang)
      const dz = (Math.random() - 0.3) * 0.8
      for (let s = 0; s < SEG; s++) {
        const j = 0.11
        const nx = x + (dx * len) / SEG + (Math.random() - 0.5) * j
        const ny = y + (dy * len) / SEG + (Math.random() - 0.5) * j
        const nz = z + (dz * len) / SEG + (Math.random() - 0.5) * j
        boltPos[k++] = x
        boltPos[k++] = y
        boltPos[k++] = z
        boltPos[k++] = nx
        boltPos[k++] = ny
        boltPos[k++] = nz
        x = nx
        y = ny
        z = nz
      }
    }
    boltGeo.attributes.position.needsUpdate = true
  }

  /* ---------- ground / wall shadow ---------- */
  const shadowMat = new THREE.ShadowMaterial({ opacity: 0.2 })
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), shadowMat)
  ground.position.z = -0.2
  ground.receiveShadow = true
  group.add(ground)

  /* ---------- light ---------- */
  const hemi = new THREE.HemisphereLight(0xffffff, 0x8c8c8c, 0.55)
  scene.add(hemi)
  const key = new THREE.DirectionalLight(0xffffff, 1.7)
  key.position.set(2.5, 4.5, 7)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.radius = 7
  key.shadow.bias = -0.0006
  Object.assign(key.shadow.camera, { left: -4.5, right: 4.5, top: 4.5, bottom: -4.5, near: 1, far: 22 })
  scene.add(key)
  const rimL = new THREE.PointLight(0xff3a2a, 0.9, 14)
  rimL.position.set(-3.5, -1.5, 2.5)
  scene.add(rimL)
  const voltL = new THREE.PointLight(0x58b0ff, 0, 7)
  group.add(voltL)

  if (renderer) {
    renderer.setClearColor(0x000000, 0)
    renderer.outputEncoding = THREE.sRGBEncoding
    renderer.toneMapping = THREE.NoToneMapping
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    // studio-style reflections, built in code
    const env = new THREE.Scene()
    env.add(new THREE.Mesh(new THREE.SphereGeometry(30, 24, 12), new THREE.MeshBasicMaterial({ color: 0x3a3a3a, side: THREE.BackSide })))
    const panel = (x, y, z, w, h, v) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(v, v, v), side: THREE.DoubleSide, toneMapped: false })
      )
      m.position.set(x, y, z)
      m.lookAt(0, 0, 0)
      env.add(m)
    }
    panel(0, 12, 4, 14, 8, 7)
    panel(-12, 2, 6, 5, 12, 4)
    panel(12, 3, 5, 4, 12, 3)
    panel(0, -2, 14, 10, 3, 2)
    const pm = new THREE.PMREMGenerator(renderer)
    scene.environment = pm.fromScene(env, 0.03).texture
    pm.dispose()
  }

  /* ---------- per-frame snake build ---------- */
  const Q = new Float32Array(3 * (N + 1))
  const P = new Float32Array(3 * (N + 1))
  const FT = new Float32Array(3 * (N + 1))
  const FN = new Float32Array(3 * (N + 1))
  const FB = new Float32Array(3 * (N + 1))
  function frames(src) {
    let px = 0
    let py = 0
    let pz = 1
    for (let i = 0; i <= N; i++) {
      const a = 3 * Math.max(0, i - 1)
      const b = 3 * Math.min(N, i + 1)
      const k = 3 * i
      let tx = src[b] - src[a]
      let ty = src[b + 1] - src[a + 1]
      let tz = src[b + 2] - src[a + 2]
      let l = Math.hypot(tx, ty, tz) || 1
      tx /= l
      ty /= l
      tz /= l
      // world Z made perpendicular to the tangent
      let nx = -tx * tz
      let ny = -ty * tz
      let nz = 1 - tz * tz
      l = Math.hypot(nx, ny, nz)
      if (l < 0.05) {
        nx = px
        ny = py
        nz = pz
      } else {
        nx /= l
        ny /= l
        nz /= l
      }
      px = nx
      py = ny
      pz = nz
      FT[k] = tx
      FT[k + 1] = ty
      FT[k + 2] = tz
      FN[k] = nx
      FN[k + 1] = ny
      FN[k + 2] = nz
      FB[k] = ty * nz - tz * ny
      FB[k + 1] = tz * nx - tx * nz
      FB[k + 2] = tx * ny - ty * nx
    }
  }
  function buildSnake(time) {
    const ab = S.ab
    const bc = S.bc
    const wave = 0.012 + 0.05 * ab * (1 - bc) + 0.012 * bc
    for (let i = 0; i <= N; i++) {
      const k = 3 * i
      const t = ringT[i]
      for (let c = 0; c < 3; c++) {
        const m = A[k + c] + (B[k + c] - A[k + c]) * ab
        Q[k + c] = m + (C[k + c] - m) * bc
      }
      Q[k + 2] += 0.05 * Math.sin(time * 1.4) * ss(0.82, 1, t) * (1 - ab) // idle head bob while coiled
    }
    frames(Q)
    for (let i = 0; i <= N; i++) {
      const k = 3 * i
      const t = ringT[i]
      const o = wave * Math.sin(t * 15 - time * 2.2) * (1 - ss(0.84, 1, t))
      P[k] = Q[k] + FB[k] * o
      P[k + 1] = Q[k + 1] + FB[k + 1] * o
      P[k + 2] = Q[k + 2] + FB[k + 2] * o
    }
    frames(P)
    let v = 0
    for (let i = 0; i <= N; i++) {
      const k = 3 * i
      const w = prof[2 * i]
      const h = prof[2 * i + 1]
      for (let j = 0; j <= RAD; j++, v += 3) {
        const c = COS[j]
        const s = SIN[j]
        pos[v] = P[k] + FB[k] * c * w + FN[k] * s * h
        pos[v + 1] = P[k + 1] + FB[k + 1] * c * w + FN[k + 1] * s * h
        pos[v + 2] = P[k + 2] + FB[k + 2] * c * w + FN[k + 2] * s * h
        const nx = FB[k] * c * h + FN[k] * s * w
        const ny = FB[k + 1] * c * h + FN[k + 1] * s * w
        const nz = FB[k + 2] * c * h + FN[k + 2] * s * w
        const l = Math.hypot(nx, ny, nz) || 1
        nor[v] = nx / l
        nor[v + 1] = ny / l
        nor[v + 2] = nz / l
      }
    }
    geo.attributes.position.needsUpdate = true
    geo.attributes.normal.needsUpdate = true

    // eyes
    const e = 3 * iEye
    const ew = prof[2 * iEye]
    const eh = prof[2 * iEye + 1]
    for (let s = 0; s < 2; s++) {
      const sg = s ? 1 : -1
      eyes[s].position.set(
        P[e] + FB[e] * ew * 0.74 * sg + FN[e] * eh * 0.58,
        P[e + 1] + FB[e + 1] * ew * 0.74 * sg + FN[e + 1] * eh * 0.58,
        P[e + 2] + FB[e + 2] * ew * 0.74 * sg + FN[e + 2] * eh * 0.58
      )
      eyeGlow[s].position.copy(eyes[s].position)
    }
    // tongue flick
    const n = 3 * N
    const cyc = (time % 2.7) / 0.55
    const flick = cyc < 1 ? Math.sin(cyc * Math.PI) * (0.8 + 0.2 * Math.sin(time * 40)) : 0
    tongue.visible = flick > 0.02
    if (tongue.visible) {
      const f = flick
      tongue.matrix.set(
        FB[n], FT[n] * f, FN[n], P[n] - FT[n] * 0.03,
        FB[n + 1], FT[n + 1] * f, FN[n + 1], P[n + 1] - FT[n + 1] * 0.03,
        FB[n + 2], FT[n + 2] * f, FN[n + 2], P[n + 2] - FT[n + 2] * 0.03,
        0, 0, 0, 1
      )
    }
  }

  /* ---------- colours ---------- */
  const cPaper = new THREE.Color(cssColor('--bg', '#d4d4d4'))
  const cNight = new THREE.Color('#0b0c10')
  const cInk = new THREE.Color(cssColor('--ink', '#16150f'))
  const cLight = new THREE.Color('#f1f1f1')
  const panel = cssColor('--panel', '#ffffff')
  const cTmp = new THREE.Color()
  const cAmber = new THREE.Color(0xffa21a)
  const cVolt = new THREE.Color(0x66bbff)
  const cRed = new THREE.Color(shu)
  let lastBg = ''
  let lastFg = ''
  let lastBar = ''
  let lastClip = ''
  const v1 = new THREE.Vector3()
  const v2 = new THREE.Vector3()

  /* ---------- timeline ---------- */
  const centreRoles = () => gsap.set('.role', { yPercent: narrow.matches ? 0 : -50 })
  centreRoles()
  narrow.addEventListener('change', centreRoles)

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: '+=460%',
      pin: true,
      scrub: reduceMotion ? true : 0.7,
      invalidateOnRefresh: true,
    },
  })
  tl.to('.cue', { autoAlpha: 0, duration: 0.5 }, 0)
    .to('.intro', { autoAlpha: 0, y: -40, duration: 1.2, ease: 'power1.in' }, 0.2)
    .to(S, { ab: 1, tiltX: 0, rotZ: 0, scale: 1, lift: 0, duration: 2.8, ease: 'power2.inOut' }, 0.3)
    .fromTo('.role-se', { autoAlpha: 0, x: -40 }, { autoAlpha: 1, x: 0, duration: 1.1, ease: 'power2.out' }, 1.8)
    .to(S, { charge: 1, duration: 2.8 }, 3.3)
    .to(S, { dark: 1, duration: 1.3, ease: 'power1.inOut' }, 3.3)
    .to('.role-se', { opacity: 0.28, duration: 0.8 }, 3.5)
    .fromTo('.role-ai', { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 1.1, ease: 'power2.out' }, 3.8)
    .to('.role, .fade-late', { autoAlpha: 0, duration: 0.7 }, 6.1)
    .to('.glyph', { opacity: 0, duration: 0.7 }, 6.1)
    .to(S, { bc: 1, duration: 2.0, ease: 'power2.inOut' }, 6.1)
    .to(S, { spin: Math.PI * 1.5, duration: 3.9, ease: 'power1.in' }, 6.1)
    .to(S, { portal: 1, duration: 0.9, ease: 'power2.out' }, 7.7)
    .to(S, { dolly: 1, duration: 1.6, ease: 'power2.in' }, 8.4)
    .fromTo(
      '.about-intro-text > *, .about-photo',
      { y: 30, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, stagger: 0.12, duration: 0.6, ease: 'power2.out' },
      9.1
    )

  // each label holds until the timeline reaches the time beside it
  const phases = [
    [0.3, '01', 'Coil'],
    [3.3, '02', 'Rise'],
    [6.1, '03', 'Charge'],
    [Infinity, '04', 'Ouroboros'],
  ]
  const phaseN = document.getElementById('phase-n')
  const phaseT = document.getElementById('phase-t')
  let lastPhase = ''

  /* ---------- pointer parallax ---------- */
  let mx = 0
  let my = 0
  let smx = 0
  let smy = 0
  window.addEventListener(
    'pointermove',
    e => {
      mx = e.clientX / window.innerWidth - 0.5
      my = e.clientY / window.innerHeight - 0.5
    },
    { passive: true }
  )

  function resize() {
    W = hero.clientWidth
    H = hero.clientHeight
    if (!renderer) return
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(W, H, false)
    camera.aspect = W / H
    camera.updateProjectionMatrix()
    baseZ = Math.max(9, 6.6 / camera.aspect)
  }
  window.addEventListener('resize', resize)
  resize()

  const clock = new THREE.Clock()
  function render() {
    const st = tl.scrollTrigger
    if (st && window.scrollY > st.end + H) return // stage has scrolled away
    const time = reduceMotion ? 0 : clock.getElapsedTime()
    const pr = tl.time()

    // phase label
    for (const p of phases)
      if (pr < p[0]) {
        if (lastPhase !== p[1]) {
          lastPhase = p[1]
          phaseN.textContent = p[1]
          phaseT.textContent = p[2]
        }
        break
      }

    // stage colours (background is set below, once the portal state is known)
    let bg = '#' + cTmp.copy(cPaper).lerp(cNight, S.dark).getHexString()
    const fg = '#' + cTmp.copy(cInk).lerp(cLight, S.dark).getHexString()
    if (fg !== lastFg) {
      lastFg = fg
      root.style.setProperty('--hero-fg', fg)
    }

    let barInk = S.dark < 0.5

    if (renderer) {
      smx += (mx - smx) * 0.06
      smy += (my - smy) * 0.06
      const calm = 1 - S.bc
      group.scale.setScalar(S.scale)
      group.position.y = S.lift
      group.rotation.set(S.tiltX + smy * 0.14 * calm, smx * 0.22 * calm, S.rotZ + S.spin)
      camera.position.set(0, 0, baseZ + (1.0 - baseZ) * S.dolly)

      buildSnake(time)

      // charge dressing
      uniforms.uCharge.value = S.charge
      uniforms.uTime.value = time
      const live = Math.sin(Math.PI * Math.min(1, S.charge)) // 0 at both ends of the charge
      const front = Math.max(0, 1 - S.charge * 1.14)
      const iF = Math.round((1 - Math.pow(1 - front, 1 / 1.6)) * N)
      const f = 3 * iF
      frontGlow.position.set(P[f], P[f + 1], P[f + 2] + 0.2)
      frontGlow.material.opacity = live * 0.6
      voltL.position.set(P[f], P[f + 1], P[f + 2] + 0.8)
      voltL.intensity = live * 2.4 + S.charge * 0.5
      const headLit = Math.min(1, S.charge * 9)
      eyeMat.emissive.copy(cAmber).lerp(cVolt, headLit)
      eyeMat.emissiveIntensity = 1.0 + headLit * 2.0
      eyeGlow[0].material.opacity = eyeGlow[1].material.opacity = headLit * 0.9
      tongueMat.color.copy(cRed).lerp(cVolt, headLit)
      bolts.material.opacity = live * (0.55 + 0.45 * Math.random())
      if (live > 0.02 && time - boltClock > 0.07) {
        boltClock = time
        strike(P[f], P[f + 1], P[f + 2])
      }
      sparks.material.opacity = Math.min(1, S.charge * 4) * 0.85
      if (S.charge > 0.001) {
        for (let i = 0; i < SP; i++) {
          const s = 5 * i
          const life = (time * (0.25 + spSeed[s] * 0.5) + spSeed[s + 1]) % 1
          const r = 3 * (iF + Math.floor(spSeed[s + 2] * (N - iF)))
          const ang = spSeed[s + 3] * 6.283
          const d = R * 1.15 + life * (0.25 + spSeed[s + 4] * 0.5)
          spPos[3 * i] = P[r] + (FB[r] * Math.cos(ang) + FN[r] * Math.sin(ang)) * d
          spPos[3 * i + 1] = P[r + 1] + (FB[r + 1] * Math.cos(ang) + FN[r + 1] * Math.sin(ang)) * d
          spPos[3 * i + 2] = P[r + 2] + (FB[r + 2] * Math.cos(ang) + FN[r + 2] * Math.sin(ang)) * d
        }
        spGeo.attributes.position.needsUpdate = true
      }
      // lighting follows the stage
      hemi.intensity = 0.55 - 0.3 * S.dark
      key.intensity = 1.7 - 0.8 * S.dark
      skin.envMapIntensity = 0.6 - 0.3 * S.dark
      shadowMat.opacity = 0.2 * (1 - S.dark)
      rimL.intensity = 0.9 * (1 - S.dark)

      renderer.render(scene, camera)
    }

    // the About sheet opens through the ring
    let clip = 'hidden'
    if (S.portal > 0.001) {
      if (renderer) {
        group.updateMatrixWorld()
        v1.set(0, 0, 0).applyMatrix4(group.matrixWorld).project(camera)
        v2.set(RING, 0, 0).applyMatrix4(group.matrixWorld).project(camera)
        const cx = (v1.x * 0.5 + 0.5) * W
        const cy = (-v1.y * 0.5 + 0.5) * H
        const r = Math.hypot((v2.x - v1.x) * 0.5 * W, (v2.y - v1.y) * 0.5 * H) * S.portal
        const diag = Math.hypot(W, H) / 2
        clip = r > diag * 1.08 ? 'none' : 'circle(' + r.toFixed(1) + 'px at ' + cx.toFixed(1) + 'px ' + cy.toFixed(1) + 'px)'
        if (r > diag * 0.92) barInk = true
      } else {
        // no ring to open through: grow a plain circle from the centre
        const r = Math.hypot(W, H) * 0.55 * S.portal * (1 + S.dolly)
        clip = S.dolly > 0.6 ? 'none' : 'circle(' + r.toFixed(1) + 'px at 50% 50%)'
        if (S.dolly > 0.4) barInk = true
      }
    }
    // fully open: match the stage to the sheet so no dark sliver shows at its edge
    if (clip === 'none') bg = panel
    if (bg !== lastBg) {
      lastBg = bg
      root.style.setProperty('--hero-bg', bg)
    }
    if (clip !== lastClip) {
      // the canvas sits above the sheet; once the sheet covers the stage, hide
      // it so no sliver of the ring or its shadow draws over the About intro
      canvas.style.visibility = clip === 'none' ? 'hidden' : ''
      lastClip = clip
      portal.style.visibility = clip === 'hidden' ? 'hidden' : 'visible'
      portal.style.clipPath = clip === 'hidden' ? 'circle(0px at 50% 50%)' : clip
    }
    const bar = barInk ? '#' + cInk.getHexString() : '#f1f1f1'
    if (bar !== lastBar) {
      lastBar = bar
      root.style.setProperty('--bar-fg', bar)
    }
  }

  // first frame now, so shaders compile behind the preloader
  render()
  gsap.ticker.add(render)

  return { tl, state: S, hasWebGL: !!renderer }
}
