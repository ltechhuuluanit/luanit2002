const THEME_KEY = "gp-theme";

const getInitialTheme = () => {
  const storedTheme = localStorage.getItem(THEME_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }
  if (window.matchMedia("(prefers-color-scheme: light)").matches) {
    return "light";
  }
  return "dark";
};

const applyTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
};

applyTheme(getInitialTheme());

const loadComponent = async (selector, filePath) => {
  const target = document.querySelector(selector);
  if (!target) return null;

  const baseUrl = new URL(".", window.location.href);
  const componentUrl = new URL(filePath, baseUrl).toString();

  try {
    const response = await fetch(componentUrl + "?v=" + Date.now(), {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("HTTP " + response.status);

    const html = await response.text();

    // Xóa script Live Server inject vào HTML fragment
    const clean = html.replace(/<script[\s\S]*?<\/script>/gi, "");

    target.innerHTML = clean;
    return target;
  } catch (error) {
    console.warn("Không thể tải " + filePath, error);
    return null;
  }
};

const initNav = () => {
  const toggle = document.querySelector("[data-nav-toggle]");
  const menu = document.querySelector("[data-nav-menu]");
  if (!toggle || !menu) {
    return;
  }

  const closeMenu = () => {
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-open");
  };

  toggle.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("nav-open", isOpen);
  });

  menu.addEventListener("click", (event) => {
    if (event.target && event.target.matches("a")) {
      closeMenu();
    }
  });

  document.addEventListener("click", (event) => {
    if (!menu.contains(event.target) && !toggle.contains(event.target)) {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 900) {
      closeMenu();
    }
  });

  // Tự động kích hoạt class active cho trang hiện tại
  const currentPath = window.location.pathname;
  let pageName = currentPath.split("/").pop() || "index.html";
  if (pageName === "") pageName = "index.html";

  const navLinks = menu.querySelectorAll("a:not(.btn)");
  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (href === pageName) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
};

const initThemeToggle = () => {
  const toggle = document.querySelector("[data-theme-toggle]");
  if (!toggle) {
    return;
  }

  const syncState = () => {
    const current =
      document.documentElement.getAttribute("data-theme") || "dark";
    toggle.setAttribute("aria-pressed", String(current === "light"));
  };

  syncState();

  toggle.addEventListener("click", () => {
    const current =
      document.documentElement.getAttribute("data-theme") || "dark";
    const nextTheme = current === "light" ? "dark" : "light";
    applyTheme(nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
    syncState();
  });
};

const initHeroSlider = () => {
  const slider = document.querySelector(".hero-slider");
  if (!slider || typeof Swiper === "undefined") {
    return;
  }

  new Swiper(slider, {
    loop: true,
    speed: 800,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },
    pagination: {
      el: ".hero-pagination",
      clickable: true,
    },
  });
};

const initCountdown = () => {
  const timer = document.querySelector("[data-countdown]");
  if (!timer) {
    return;
  }

  const duration = Number(timer.dataset.duration) || 8130;
  const storageKey = "gp-flash-sale-end";
  const now = Date.now();
  let endTime = Number(localStorage.getItem(storageKey));

  if (!endTime || endTime <= now) {
    endTime = now + duration * 1000;
    localStorage.setItem(storageKey, String(endTime));
  }

  const update = () => {
    const remaining = endTime - Date.now();
    if (remaining <= 0) {
      endTime = Date.now() + duration * 1000;
      localStorage.setItem(storageKey, String(endTime));
    }
    const totalSeconds = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
      2,
      "0",
    );
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    timer.textContent = `${hours}:${minutes}:${seconds}`;
  };

  update();
  window.setInterval(update, 1000);
};

const initStickyCta = () => {
  const stickyCta = document.querySelector(".sticky-cta");
  if (stickyCta) {
    document.body.classList.add("has-sticky-cta");
  }
};

const initScrollReveal = () => {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) {
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    items.forEach((item) => item.classList.add("active"));
    return;
  }

  if (!("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("active"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, current) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          current.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 },
  );

  items.forEach((item) => observer.observe(item));
};

const initScrollHeader = () => {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 20) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  };

  handleScroll();
  window.addEventListener("scroll", handleScroll, { passive: true });
};

const init = async () => {
  // Apply theme from localStorage
  applyTheme(getInitialTheme());

  // Header & footer are inlined — no fetch needed.
  // Try to load components only if header/footer are empty (fallback for pages using dynamic loading).
  const headerEl = document.querySelector("header");
  const footerEl = document.querySelector("footer");
  const needsComponents = (headerEl && headerEl.innerHTML.trim() === "") || (footerEl && footerEl.innerHTML.trim() === "");
  if (needsComponents) {
    await Promise.all([
      loadComponent("header", "components/header.html"),
      loadComponent("footer", "components/footer.html"),
    ]);
  }

  initNav();
  initScrollHeader();
  initThemeToggle();
  initHeroSlider();
  initCountdown();
  initStickyCta();
  initScrollReveal();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
