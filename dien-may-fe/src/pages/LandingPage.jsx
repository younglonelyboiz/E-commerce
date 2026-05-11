/**
 * LandingPage.jsx
 * Aesthetic: "Cinematic Tech" — bold typography, platform-centric, airy, light
 * Palette:   white + sky-blue tints
 * Fonts:     Plus Jakarta Sans (display) + DM Sans (body)
 * Framework: Tailwind v4
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

// ── Google Fonts injection ────────────────────────────────────────────────────
const FontLink = () => (
  <link
    href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;700;800;900&family=DM+Sans:wght@300;400;500;700&display=swap"
    rel="stylesheet"
  />
);

// ── Scroll-reveal ────────────────────────────────────────────────────────────
function useVisible(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// dir: 'up' | 'left' | 'right' | 'scale'
function FadeIn({ children, delay = 0, dir = 'up', className = '' }) {
  const { ref, visible } = useVisible();
  const hidden = {
    up: 'translateY(40px)',
    down: 'translateY(-40px)',
    left: 'translateX(-50px)',
    right: 'translateX(50px)',
    scale: 'scale(0.85)',
  }[dir] ?? 'translateY(40px)';
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : hidden,
        transition: `opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// Parallax helper — moves element on scroll
function useParallax(speed = 0.12) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const rect = el.getBoundingClientRect();
          const center = window.innerHeight / 2;
          const offset = (rect.top + rect.height / 2 - center) * speed;
          el.style.transform = `translateY(${offset}px)`;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [speed]);
  return ref;
}

// ── DATA ──────────────────────────────────────────────────────────────────────

// Using a sleek device mockup to represent the platform running flawlessly
const HERO_IMG = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/macbook-air-midnight-select-20220606?wid=904&hei=840&fmt=png-alpha&.v=1653084303665';
const FALLBACK = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/macbook-air-midnight-select-20220606?wid=904&hei=840&fmt=png-alpha';
const IPHONE_IMG = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-blue-select-202309?wid=940&hei=1112&fmt=png-alpha&.v=1693086393755';

const STATS = [
  { val: '1M+', label: 'Người dùng' },
  { val: '< 1s', label: 'Tốc độ tải trang' },
  { val: '2h', label: 'Giao hàng hỏa tốc' },
  { val: '100%', label: 'Bảo mật an toàn' },
];

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: 'Tải Siêu Tốc',
    desc: 'Kiến trúc tối ưu, LCP < 1s. Website phản hồi ngay lập tức trên mọi thiết bị và đường truyền.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: 'Thanh Toán Bảo Mật',
    desc: 'Mã hóa SSL 256-bit. Giao dịch chớp nhoáng, an toàn tuyệt đối với PayOS và VietQR.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    title: 'Giao Hàng Hỏa Tốc',
    desc: 'Hệ thống vận chuyển tối ưu. Từ lúc chốt đơn đến khi trên tay chỉ tính bằng giờ.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
    title: 'Hàng Chính Hãng',
    desc: 'Được kiểm duyệt nghiêm ngặt. 100% sản phẩm có nguồn gốc xuất xứ rõ ràng.',
  },
];

const PLATFORM_FEATURES = [
  { label: 'Tìm kiếm', value: 'Gợi ý tức thì, siêu tốc và chính xác' },
  { label: 'Giao diện', value: 'Tối ưu hoàn hảo cho cả Mobile & Desktop' },
  { label: 'Đơn hàng', value: 'Cập nhật trạng thái theo thời gian thực' },
  { label: 'Bảo mật', value: 'Kiến trúc bảo mật nhiều lớp, an toàn tuyệt đối' },
  { label: 'Kết nối', value: 'Chat hỗ trợ trực tuyến 24/7' },
  { label: 'Hệ thống', value: 'Uptime 99.9% nhờ cơ sở hạ tầng mạnh mẽ' },
];

const TESTIMONIALS = [
  {
    name: 'Nguyễn Minh Khoa',
    role: 'Software Engineer',
    quote: 'Website phản hồi tức thì ngay cả khi dùng 3G. Quá trình thanh toán mượt mà không điểm dừng. Rất ấn tượng với kỹ thuật của đội ngũ Điện Máy.',
    avatar: 'MK',
    color: 'bg-sky-100 text-sky-700',
  },
  {
    name: 'Trần Lan Anh',
    role: 'Product Manager',
    quote: 'UI gọn gàng, UX được tối ưu chuẩn xác. Trải nghiệm từ lúc tìm kiếm đến lúc mua hàng cực kỳ liền mạch và chuyên nghiệp.',
    avatar: 'LA',
    color: 'bg-violet-100 text-violet-700',
  },
  {
    name: 'Phạm Đức Anh',
    role: 'Tech Reviewer',
    quote: 'Rất hiếm nền tảng thương mại điện tử nào tại Việt Nam có tốc độ render nhanh như Điện Máy. Đây là trải nghiệm mua sắm chuẩn tương lai.',
    avatar: 'ĐA',
    color: 'bg-emerald-100 text-emerald-700',
  },
];

// ── SECTIONS ──────────────────────────────────────────────────────────────────

/* ① HERO — Giant typography, platform focus */
function Hero() {
  const blobRef1 = useParallax(0.15);
  const blobRef2 = useParallax(-0.1);
  const imgRef = useParallax(0.08);

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden px-5"
      style={{ background: 'linear-gradient(160deg, #f0f9ff 0%, #ffffff 65%, #e0f2fe 100%)' }}
    >
      {/* decorative blobs with parallax */}
      <div ref={blobRef1} className="blob w-[30rem] h-[30rem] bg-sky-200/50 -top-32 -left-32 rounded-full filter blur-[100px] absolute" />
      <div ref={blobRef2} className="blob w-[20rem] h-[20rem] bg-blue-300/30 bottom-10 right-10 rounded-full filter blur-[80px] absolute" />

      <div className="relative z-10 mx-auto max-w-7xl w-full flex flex-col lg:flex-row items-center gap-16 py-32">

        {/* LEFT: copy */}
        <div className="flex-1 w-full z-20">
          <FadeIn>
            <span
              className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
              style={{ background: '#e0f2fe', color: '#0284c7' }}
            >
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              Nền tảng thương mại điện tử tương lai
            </span>
          </FadeIn>

          <FadeIn delay={80}>
            {/* Giant Typography, tight tracking */}
            <h1
              className="text-6xl md:text-[7rem] lg:text-[8rem] leading-[0.9] font-display font-black tracking-tighter"
              style={{ color: '#0f172a' }}
            >
              Mua sắm.<br />
              <span style={{ color: '#0ea5e9' }}>Siêu tốc.</span>
            </h1>
          </FadeIn>

          <FadeIn delay={160}>
            <p
              className="mt-8 text-xl md:text-2xl leading-relaxed font-body"
              style={{ color: '#475569', fontWeight: 400, maxWidth: '600px' }}
            >
              Trải nghiệm mua sắm mượt mà nhất bạn từng biết. Tốc độ tải trang dưới 1 giây, thanh toán bảo mật tuyệt đối, và hàng hóa tận tay chỉ trong 2 giờ.
            </p>
          </FadeIn>

          <FadeIn delay={240}>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/home"
                className="no-underline rounded-2xl px-8 py-4 text-lg font-bold text-white shadow-xl transition-transform hover:-translate-y-1 active:scale-95 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', boxShadow: '0 12px 32px #0ea5e950' }}
              >
                Khám phá hệ thống
              </Link>
              <Link
                to="/home"
                className="no-underline rounded-2xl px-8 py-4 text-lg font-bold transition-all hover:bg-sky-50 flex items-center justify-center border-2"
                style={{ color: '#0284c7', borderColor: '#bae6fd', background: 'transparent' }}
              >
                Tìm hiểu công nghệ
              </Link>
            </div>
          </FadeIn>
        </div>

        {/* RIGHT: floating device mockup */}
        <div className="flex-1 flex justify-center relative w-full lg:w-auto mt-12 lg:mt-0 z-10 pointer-events-none">
          {/* soft glow disc behind */}
          <div style={{
            position: 'absolute', width: '100%', height: '100%', borderRadius: '50%',
            background: 'radial-gradient(circle, #7dd3fc66 0%, transparent 60%)',
            top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            pointerEvents: 'none',
          }} />
          <FadeIn delay={120} dir="right" className="relative w-full flex justify-center">
             <div ref={imgRef} className="relative w-full max-w-[600px] lg:scale-110 lg:translate-x-12">
               <img
                  src={HERO_IMG}
                  alt="Tech Platform mockup"
                  style={{
                    width: '100%', height: 'auto', objectFit: 'contain',
                    mixBlendMode: 'multiply',
                    filter: 'drop-shadow(0 30px 50px #0ea5e940)',
                    animation: 'phoneFloat 6s ease-in-out infinite',
                  }}
                  onError={e => { e.target.src = FALLBACK; }}
               />
             </div>
          </FadeIn>
        </div>
      </div>

      {/* bottom wave */}
      <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ height: 60 }}>
        <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="white" />
      </svg>
    </section>
  );
}

/* ② STATS BAR */
function StatsBar() {
  return (
    <section className="bg-white py-14 px-5 border-y" style={{ borderColor: '#f0f9ff' }}>
      <div className="mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
        {STATS.map((s, i) => (
          <FadeIn key={s.val} delay={i * 80}>
            <p className="text-5xl md:text-6xl font-display font-black tracking-tight" style={{ color: '#0284c7' }}>{s.val}</p>
            <p className="mt-2 text-lg font-body font-bold" style={{ color: '#64748b' }}>{s.label}</p>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

/* ③ FEATURES grid */
function Features() {
  return (
    <section className="py-28 px-5 bg-white">
      <div className="mx-auto max-w-7xl">
        <FadeIn>
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-display font-black tracking-tighter" style={{ color: '#0f172a' }}>
              Kiến trúc{' '}
              <span style={{ color: '#0ea5e9' }}>tân tiến nhất</span>
            </h2>
            <p className="mt-5 text-xl font-body max-w-2xl mx-auto" style={{ color: '#64748b', fontWeight: 400 }}>
              Chúng tôi đập bỏ những lối mòn cũ để xây dựng một nền tảng thương mại điện tử thực sự vượt trội, tối ưu hóa cho từng microsecond.
            </p>
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f, i) => (
            <FadeIn key={f.title} delay={i * 100}>
              <div
                className="group h-full rounded-3xl p-8 border-2 transition-all hover:-translate-y-2 hover:shadow-2xl"
                style={{ borderColor: '#e0f2fe', background: '#fafdfa', backgroundColor: '#ffffff' }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors group-hover:bg-sky-500 group-hover:text-white"
                  style={{ background: '#f0f9ff', color: '#0284c7' }}
                >
                  {f.icon}
                </div>
                <h3 className="text-2xl font-display font-black mb-3 tracking-tight" style={{ color: '#0f172a' }}>{f.title}</h3>
                <p className="text-lg font-body leading-relaxed" style={{ color: '#64748b', fontWeight: 400 }}>{f.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ④ PLATFORM SPOTLIGHT */
function PlatformSpotlight() {
  const spotlightRef = useParallax(0.05);

  return (
    <section
      className="py-20 px-5 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%)' }}
    >
      <div className="blob w-96 h-96 bg-sky-200/30 -top-10 -right-10 rounded-full filter blur-[80px] absolute pointer-events-none" />

      <div className="mx-auto max-w-7xl flex flex-col lg:flex-row items-center gap-12 relative z-10">
        {/* Abstract UI representation instead of product */}
        <FadeIn delay={60} dir="left" className="flex-1 w-full">
          <div ref={spotlightRef} className="relative flex items-center justify-center w-full aspect-square max-w-[450px] mx-auto rounded-full bg-gradient-to-tr from-sky-100 to-white border-8 border-white shadow-2xl p-6">
                <div className="w-full h-full bg-sky-500/10 rounded-full flex items-center justify-center relative">
                    <img
                        src={IPHONE_IMG}
                        alt="Tech Platform mockup"
                        style={{
                          width: 'auto', maxHeight: '115%', objectFit: 'contain',
                          mixBlendMode: 'multiply',
                          filter: 'drop-shadow(0 20px 36px #0ea5e960)',
                          animation: 'phoneFloat 4s ease-in-out infinite',
                        }}
                    />
                </div>
          </div>
        </FadeIn>

        {/* Platform Specs */}
        <div className="flex-1">
          <FadeIn dir="right">
            <span className="text-sm font-bold tracking-widest uppercase" style={{ color: '#0ea5e9' }}>
              Trải nghiệm cốt lõi
            </span>
            <h2 className="mt-2 text-5xl md:text-6xl font-display font-black leading-[1.05] tracking-tighter" style={{ color: '#0f172a' }}>
              Trải nghiệm<br />
              chuẩn tương lai.
            </h2>
            <p className="mt-4 text-lg font-body leading-relaxed" style={{ color: '#475569', fontWeight: 400 }}>
              Không để bạn phải chờ đợi. Không gián đoạn luồng suy nghĩ. Hệ thống Điện Máy mang lại cảm giác phản hồi liền mạch như một ứng dụng gốc trên chính thiết bị của bạn.
            </p>
          </FadeIn>

          <div className="mt-6 grid gap-3">
            {PLATFORM_FEATURES.map((s, i) => (
              <FadeIn key={s.label} delay={i * 80}>
                <div
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 rounded-2xl p-4 border-2 transition-colors hover:border-sky-300"
                  style={{ background: 'white', borderColor: '#f0f9ff' }}
                >
                  <span className="text-sm font-bold uppercase tracking-widest w-32 shrink-0" style={{ color: '#0ea5e9' }}>
                    {s.label}
                  </span>
                  <span className="text-lg font-body font-medium" style={{ color: '#334155' }}>{s.value}</span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ⑤ TESTIMONIALS */
function Testimonials() {
  return (
    <section className="py-32 px-5 bg-white">
      <div className="mx-auto max-w-7xl">
        <FadeIn>
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-display font-black tracking-tighter" style={{ color: '#0f172a' }}>
              Cộng đồng{' '}
              <span style={{ color: '#0ea5e9' }}>chuyên gia</span>
            </h2>
            <p className="mt-5 text-xl font-body" style={{ color: '#64748b', fontWeight: 400 }}>
              Sự công nhận từ những người dùng khắt khe nhất trong giới công nghệ.
            </p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, i) => (
            <FadeIn key={t.name} delay={i * 100}>
              <div
                className="h-full flex flex-col gap-6 rounded-3xl p-8 border-2 transition-all hover:shadow-xl hover:-translate-y-2"
                style={{ borderColor: '#f0f9ff', background: '#fafdfa' }}
              >
                {/* stars */}
                <div className="flex text-amber-400 text-xl tracking-widest">{'★'.repeat(5)}</div>
                <p className="flex-1 text-lg font-body leading-relaxed font-medium" style={{ color: '#334155' }}>
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-4 pt-5 border-t-2" style={{ borderColor: '#f0f9ff' }}>
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${t.color}`}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-lg font-display font-black" style={{ color: '#0f172a' }}>{t.name}</p>
                    <p className="text-sm font-body font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>{t.role}</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ⑥ CTA BAND */
function CTA() {
  const ctaRef = useParallax(-0.05);

  return (
    <section
      className="py-36 px-5 text-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #082f49 100%)' }}
    >
      <div className="blob w-[40rem] h-[40rem] bg-white/5 -top-32 -left-32 rounded-full absolute pointer-events-none filter blur-[50px]" />
      <div className="blob w-[30rem] h-[30rem] bg-sky-400/20 -bottom-20 right-0 rounded-full absolute pointer-events-none filter blur-[50px]" />

      <FadeIn>
        <div ref={ctaRef} className="relative z-10 mx-auto max-w-3xl">
          <h2 className="text-5xl md:text-[4.5rem] font-display font-black text-white leading-[1.05] tracking-tighter">
            Sẵn sàng để cảm nhận<br />
            <span style={{ color: '#bae6fd' }}>sự khác biệt?</span>
          </h2>
          <p className="mt-8 text-2xl text-sky-100 font-body font-light">
            Tham gia cùng hàng triệu người dùng đang trải nghiệm hệ thống thương mại điện tử nhanh nhất Việt Nam.
          </p>
          <div className="mt-12">
            <Link
              to="/shop"
              className="no-underline inline-block rounded-2xl px-12 py-5 text-2xl font-black transition-transform hover:scale-105 active:scale-95"
              style={{ background: 'white', color: '#0369a1', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
            >
              Bắt đầu mua sắm ngay
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-8 text-base text-sky-200 font-body font-bold">
            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-400"></div> Không độ trễ</span>
            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-400"></div> Bảo mật tuyệt đối</span>
            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-400"></div> Giao diện đỉnh cao</span>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}

/* ⑦ FOOTER */
function Footer() {
  return (
    <footer className="bg-white border-t-2 py-12 px-5" style={{ borderColor: '#f0f9ff' }}>
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-base font-body font-bold" style={{ color: '#94a3b8' }}>
          © {new Date().getFullYear()} Nền tảng Điện Máy. Mã nguồn & Tốc độ.
        </p>
        <div className="flex gap-8 text-base font-body font-bold" style={{ color: '#64748b' }}>
          {['Trang chủ', 'Tính năng', 'Công nghệ', 'Liên hệ'].map(l => (
            <Link key={l} to="/shop" className="no-underline hover:text-sky-500 transition-colors">{l}</Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      <FontLink />
      <div className="font-body antialiased selection:bg-sky-200 selection:text-sky-900" style={{ background: 'white' }}>
        <Hero />
        <StatsBar />
        <Features />
        <PlatformSpotlight />
        <Testimonials />
        <CTA />
        <Footer />
      </div>
    </>
  );
}
