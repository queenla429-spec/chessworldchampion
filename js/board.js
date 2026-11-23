/*! 체스판 (기존 오목 BoardView와 같은 인터페이스: set / destroy / onTap) */
(function(){
  const CR = window.ChessRules;
  const G = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };

  class BoardView {
    constructor(canvas, opts = {}) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.opts = opts;
      this.state = { moves: [], flip: false, sel: null, targets: [], ghost: null };
      this._ro = new ResizeObserver(() => this.draw()); this._ro.observe(canvas);
      if (opts.interactive && opts.onTap) {
        this._f = e => {
          const r = canvas.getBoundingClientRect(), pad = this._pad(), span = 1 - pad * 2;
          let x = Math.floor(((e.clientX - r.left) / r.width - pad) / span * 8);
          let y = Math.floor(((e.clientY - r.top) / r.height - pad) / span * 8);
          if (x < 0 || x > 7 || y < 0 || y > 7) return;
          if (this.state.flip) { x = 7 - x; y = 7 - y; }
          opts.onTap(y * 8 + x);                      // 항상 a8=0 … h1=63
        };
        canvas.addEventListener('pointerup', this._f);
      }
      this.draw();
    }
    _pad() { return this.opts.labels && !this.opts.mini ? 0.05 : 0; }
    set(n) { Object.assign(this.state, n || {}); this.draw(); }
    destroy() { this._ro && this._ro.disconnect(); this._f && this.canvas.removeEventListener('pointerup', this._f); }

    draw() {
      const { canvas: cv, ctx, opts, state: s } = this;
      const dpr = Math.min(2, window.devicePixelRatio || 1), size = Math.max(120, Math.round((cv.clientWidth || 300) * dpr));
      if (cv.width !== size || cv.height !== size) cv.width = cv.height = size;
      const pad = size * this._pad(), cell = (size - pad * 2) / 8, fl = s.flip;
      const X = x => pad + (fl ? 7 - x : x) * cell, Y = y => pad + (fl ? 7 - y : y) * cell;
      let c; try { c = CR.from(s.moves); } catch (e) { return; }
      const bd = c.board();

      ctx.fillStyle = '#8a5a2b'; ctx.fillRect(0, 0, size, size);
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
        ctx.fillStyle = (x + y) % 2 ? '#b98545' : '#ecd0a0'; ctx.fillRect(X(x), Y(y), cell, cell);
      }
      const tint = (i, col) => { ctx.fillStyle = col; ctx.fillRect(X(i & 7), Y(i >> 3), cell, cell); };
      const last = (s.moves || []).slice(-1)[0];
      if (last) { tint(CR.idx(last.slice(0, 2)), 'rgba(255,225,60,.45)'); tint(CR.idx(last.slice(2, 4)), 'rgba(255,225,60,.55)'); }
      if (s.sel != null) tint(s.sel, 'rgba(60,130,255,.45)');
      if (c.in_check()) for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
        const p = bd[y][x]; if (p && p.type === 'k' && p.color === c.turn()) tint(y * 8 + x, 'rgba(230,40,40,.55)');
      }

      if (opts.labels && !opts.mini) {
        ctx.fillStyle = 'rgba(255,240,210,.9)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = `700 ${Math.max(9, Math.round(pad * 0.55))}px system-ui,sans-serif`;
        for (let i = 0; i < 8; i++) {
          ctx.fillText('abcdefgh'[fl ? 7 - i : i], pad + (i + .5) * cell, size - pad / 2);
          ctx.fillText(String(fl ? i + 1 : 8 - i), pad / 2, pad + (i + .5) * cell);
        }
      }

      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `${cell * 0.8}px "Segoe UI Symbol","Noto Sans Symbols 2","Apple Symbols",serif`;
      ctx.lineWidth = Math.max(1, cell * 0.04); ctx.strokeStyle = '#222';
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
        const p = bd[y][x]; if (!p) continue;
        const t = G[p.type] + '\uFE0E', cx = X(x) + cell / 2, cy = Y(y) + cell * 0.54;
        if (p.color === 'w') { ctx.fillStyle = '#fff'; ctx.strokeText(t, cx, cy); } else ctx.fillStyle = '#161616';
        ctx.fillText(t, cx, cy);
      }

      if (!opts.mini) {
        for (const i of s.targets || []) {
          const x = i & 7, y = i >> 3, cx = X(x) + cell / 2, cy = Y(y) + cell / 2;
          ctx.beginPath();
          if (bd[y][x]) { ctx.strokeStyle = 'rgba(46,160,67,.85)'; ctx.lineWidth = cell * 0.08; ctx.arc(cx, cy, cell * 0.44, 0, 7); ctx.stroke(); }
          else { ctx.fillStyle = 'rgba(46,160,67,.7)'; ctx.arc(cx, cy, cell * 0.14, 0, 7); ctx.fill(); }
        }
        if (s.ghost) {
          const a = s.ghost.from, b = s.ghost.to;
          ctx.strokeStyle = '#2563eb'; ctx.lineWidth = cell * 0.08;
          ctx.strokeRect(X(b & 7) + cell * .05, Y(b >> 3) + cell * .05, cell * .9, cell * .9);
          ctx.beginPath(); ctx.moveTo(X(a & 7) + cell / 2, Y(a >> 3) + cell / 2); ctx.lineTo(X(b & 7) + cell / 2, Y(b >> 3) + cell / 2); ctx.stroke();
        }
      }
    }
  }
  window.BoardView = BoardView;
})();
