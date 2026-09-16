(() => {
  const start = () => {
    if (window.GLightbox && document.querySelector(".portfolio-lightbox")) {
      window.GLightbox({ selector: ".portfolio-lightbox" });
    }
    if (window.Swiper && document.querySelector(".portfolio-details-slider")) {
      new window.Swiper(".portfolio-details-slider", {
        speed: 400,
        loop: true,
        autoplay: { delay: 5000, disableOnInteraction: false },
        pagination: { el: ".swiper-pagination", type: "bullets", clickable: true },
      });
    }
  };
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", start, { once: true })
    : start();
})();
