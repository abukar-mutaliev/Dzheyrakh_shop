export function MotionStyles() {
  return (
    <style>{`
      .lift {
        transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.55s ease;
      }
      .lift:hover {
        transform: translateY(-6px);
        box-shadow: 0 30px 54px -30px color-mix(in srgb, var(--primary) 58%, transparent);
      }
      .photo-live {
        animation: ken 18s ease-in-out infinite alternate;
      }
      .photo-swap {
        animation: photo-swap 0.5s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .float-soft { animation: float-soft 5.6s ease-in-out infinite; }
      .steam {
        transform-box: fill-box;
        transform-origin: center bottom;
        animation: steam 3.4s ease-in-out infinite;
      }
      .drip {
        transform-box: fill-box;
        transform-origin: center top;
        animation: drip 3.8s ease-in-out infinite;
      }
      .rise-in { animation: rise 0.75s cubic-bezier(0.22, 1, 0.36, 1) both; }
      .cart-pop, .qty-pop { animation: pop 0.42s cubic-bezier(0.22, 1, 0.36, 1); }
      .qty-btn {
        transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.2s ease;
      }
      .qty-btn:hover:not(:disabled) { background: color-mix(in srgb, var(--primary) 8%, white); }
      .qty-btn:active:not(:disabled) { transform: scale(0.9); }
      .choice {
        transition: border-color 0.35s ease, background-color 0.35s ease, transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .choice:active { transform: scale(0.985); }

      ::view-transition { pointer-events: none; }
      ::view-transition-group(site-header),
      ::view-transition-group(site-footer) { animation: none; z-index: 100; }
      ::view-transition-old(site-header),
      ::view-transition-old(site-footer) { display: none; }
      ::view-transition-new(site-header),
      ::view-transition-new(site-footer) { animation: none; }
      ::view-transition-group(.morph) {
        animation-duration: 560ms;
        animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
      }
      ::view-transition-group(.morph),
      ::view-transition-image-pair(.morph),
      ::view-transition-old(.morph),
      ::view-transition-new(.morph),
      ::view-transition-group(.frame),
      ::view-transition-image-pair(.frame),
      ::view-transition-old(.frame),
      ::view-transition-new(.frame) {
        border-radius: 1.75rem;
        overflow: clip;
        clip-path: inset(0 round 1.75rem);
      }
      ::view-transition-old(.morph),
      ::view-transition-new(.morph),
      ::view-transition-old(.frame),
      ::view-transition-new(.frame) {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      ::view-transition-image-pair(.morph) { animation-name: via-blur; }
      ::view-transition-old(.rise) { animation: 180ms ease-in both fade reverse; }
      ::view-transition-new(.rise) {
        animation: 280ms ease-out 120ms both fade, 520ms cubic-bezier(0.22, 1, 0.36, 1) both slide-y;
      }
      ::view-transition-old(.nav-forward) {
        --slide-offset: -48px;
        animation: 160ms ease-in both fade reverse, 480ms cubic-bezier(0.22, 1, 0.36, 1) both slide reverse;
      }
      ::view-transition-new(.nav-forward) {
        --slide-offset: 48px;
        animation: 280ms ease-out 120ms both fade, 480ms cubic-bezier(0.22, 1, 0.36, 1) both slide;
      }
      ::view-transition-old(.nav-back) {
        --slide-offset: 48px;
        animation: 160ms ease-in both fade reverse, 480ms cubic-bezier(0.22, 1, 0.36, 1) both slide reverse;
      }
      ::view-transition-new(.nav-back) {
        --slide-offset: -48px;
        animation: 280ms ease-out 120ms both fade, 480ms cubic-bezier(0.22, 1, 0.36, 1) both slide;
      }

      @keyframes float-soft {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }
      @keyframes steam {
        0%, 100% { transform: translateY(0); opacity: 0.28; }
        50% { transform: translateY(-7px); opacity: 0.7; }
      }
      @keyframes drip {
        0%, 100% { transform: scaleY(1); }
        50% { transform: scaleY(1.08); }
      }
      @keyframes ken {
        from { transform: scale(1); }
        to { transform: scale(1.07); }
      }
      @keyframes photo-swap {
        from { opacity: 0; transform: translateX(var(--swap-x, 16px)); }
        to { opacity: 1; transform: none; }
      }
      @keyframes rise {
        from { opacity: 0; transform: translateY(16px); }
        to { opacity: 1; transform: none; }
      }
      @keyframes pop {
        0% { transform: scale(0.72); }
        55% { transform: scale(1.12); }
        100% { transform: scale(1); }
      }
      @keyframes fade {
        from { filter: blur(3px); opacity: 0; }
        to { filter: blur(0); opacity: 1; }
      }
      @keyframes slide-y {
        from { transform: translateY(14px); }
        to { transform: translateY(0); }
      }
      @keyframes slide {
        from { translate: var(--slide-offset); }
        to { translate: 0; }
      }
      @keyframes via-blur {
        35% { filter: blur(2px); }
      }

      @media (prefers-reduced-motion: reduce) {
        .float-soft, .steam, .drip, .rise-in, .cart-pop, .qty-pop, .photo-live, .photo-swap, body::before { animation: none; }
        .lift:hover, .btn:hover:not(:disabled) { transform: none; }
        ::view-transition-old(*), ::view-transition-new(*), ::view-transition-group(*) {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
        }
      }
    `}</style>
  );
}
