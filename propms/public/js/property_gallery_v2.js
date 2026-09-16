(() => {
  const dialog = document.querySelector("[data-property-gallery-dialog]");
  if (!dialog || typeof dialog.showModal !== "function") return;
  const triggers = [...document.querySelectorAll("[data-property-gallery-open]")];
  const image = dialog.querySelector("[data-property-gallery-image]");
  let active = 0;

  const show = (index) => {
    active = (index + triggers.length) % triggers.length;
    const source = triggers[active].querySelector("img");
    image.src = source.currentSrc || source.src;
    image.alt = source.alt;
  };

  triggers.forEach((trigger, index) => trigger.addEventListener("click", () => {
    show(index);
    dialog.showModal();
  }));
  dialog.querySelector("[data-property-gallery-close]").addEventListener("click", () => dialog.close());
  dialog.querySelector("[data-property-gallery-previous]").addEventListener("click", () => show(active - 1));
  dialog.querySelector("[data-property-gallery-next]").addEventListener("click", () => show(active + 1));
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
})();
