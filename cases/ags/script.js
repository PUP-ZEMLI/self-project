const siteHeader = document.querySelector(".header");
      const menuToggle = document.querySelector(".menu-toggle");
      const closeMobileMenu = () => {
        siteHeader.classList.remove("menu-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Открыть меню");
      };
      menuToggle.addEventListener("click", (event) => {
        event.stopPropagation();
        const willOpen = !siteHeader.classList.contains("menu-open");
        siteHeader.classList.toggle("menu-open", willOpen);
        menuToggle.setAttribute("aria-expanded", String(willOpen));
        menuToggle.setAttribute(
          "aria-label",
          willOpen ? "Закрыть меню" : "Открыть меню",
        );
      });
      document
        .querySelectorAll(".links a")
        .forEach((link) => link.addEventListener("click", closeMobileMenu));
      document.addEventListener("click", (event) => {
        if (!siteHeader.contains(event.target)) closeMobileMenu();
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeMobileMenu();
      });
      window.addEventListener("resize", () => {
        if (window.innerWidth > 800) closeMobileMenu();
      });
      const slideCount = document.querySelectorAll(".adv-card").length;
      const slideTrack = document.querySelector("#adv-track");
      const slideViewport = document.querySelector(".adv-viewport");
      const previousButton = document.querySelector("#prev");
      const nextButton = document.querySelector("#next");
      const originalSlides = [...slideTrack.children];
      // Add cards on both sides so forward and backward loops stay one-card wide.
      const leadingClone = originalSlides.at(-1).cloneNode(true);
      leadingClone.setAttribute("aria-hidden", "true");
      slideTrack.prepend(leadingClone);
      originalSlides.slice(0, 2).forEach((card) => {
        const clone = card.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        slideTrack.append(clone);
      });
      let currentSlide = 1;
      let sliderAnimating = false;
      let sliderFinishTimer;
      const renderSlide = (animate = true) => {
        if (!animate) slideTrack.style.transition = "none";
        const step =
          slideTrack.firstElementChild.getBoundingClientRect().width + 24;
        slideTrack.style.transform = `translateX(-${currentSlide * step}px)`;
        const visibleCount = window.matchMedia("(max-width: 600px)").matches
          ? 1
          : 2;
        const visibleCards = [...slideTrack.children].slice(
          currentSlide,
          currentSlide + visibleCount,
        );
        const visibleHeight = Math.max(
          ...visibleCards.map((card) => card.getBoundingClientRect().height),
        );
        slideViewport.style.height = `${visibleHeight}px`;
        slideTrack.style.height = `${visibleHeight}px`;
        if (!animate) {
          slideTrack.getBoundingClientRect();
          slideTrack.style.transition = "";
        }
      };
      const finishSliderTransition = () => {
        clearTimeout(sliderFinishTimer);
        if (currentSlide === 0) {
          currentSlide = slideCount;
          renderSlide(false);
        } else if (currentSlide === slideCount + 1) {
          currentSlide = 1;
          renderSlide(false);
        }
        sliderAnimating = false;
      };
      const moveSlider = (direction) => {
        if (sliderAnimating) return;
        sliderAnimating = true;
        currentSlide += direction;
        renderSlide();
        sliderFinishTimer = setTimeout(finishSliderTransition, 760);
      };
      const showPreviousSlide = () => moveSlider(-1);
      const showNextSlide = () => moveSlider(1);
      slideTrack.addEventListener("transitionend", (event) => {
        if (event.propertyName === "transform") finishSliderTransition();
      });
      renderSlide(false);
      previousButton.addEventListener("click", showPreviousSlide);
      nextButton.addEventListener("click", showNextSlide);
      window.addEventListener("resize", () => renderSlide(false));
      document.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") previousButton.click();
        if (event.key === "ArrowRight") nextButton.click();
      });
      document
        .querySelectorAll(".service")
        .forEach((serviceCard) => serviceCard.classList.add("reveal"));
      const servicesObserver = new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              servicesObserver.unobserve(entry.target);
            }
          }),
        { threshold: 0.2 },
      );
      document
        .querySelectorAll(".service")
        .forEach((serviceCard) => servicesObserver.observe(serviceCard));
      const projectCards = [...document.querySelectorAll(".project")];
      const projectGrid = document.querySelector("#projectGrid");
      const extraProjectCards = projectCards.slice(6);
      const moreButton = document.querySelector("#more");
      const moreLabel = moreButton.querySelector("span:first-child");
      const collapsedProjectHeight = () =>
        projectCards[5].offsetTop +
        projectCards[5].offsetHeight +
        parseFloat(getComputedStyle(projectGrid).paddingBottom);
      projectGrid.style.maxHeight = `${collapsedProjectHeight()}px`;
      moreButton.addEventListener("click", () => {
        const expanded = moreButton.getAttribute("aria-expanded") === "true";
        moreButton.disabled = true;
        moreButton.setAttribute("aria-expanded", String(!expanded));
        moreButton.classList.toggle("expanded", !expanded);
        moreLabel.textContent = expanded
          ? "Показать все проекты"
          : "Свернуть проекты";
        if (!expanded) {
          projectGrid.style.maxHeight = `${projectGrid.getBoundingClientRect().height}px`;
          extraProjectCards.forEach((card, index) => {
            card.classList.remove("hidden");
            card.classList.add("project-entering");
            card.style.setProperty(
              "--project-delay",
              `${Math.min(index, 5) * 55}ms`,
            );
            card.removeAttribute("aria-hidden");
          });
          requestAnimationFrame(() => {
            projectGrid.style.maxHeight = `${projectGrid.scrollHeight}px`;
          });
          setTimeout(() => {
            projectGrid.style.maxHeight = "none";
            extraProjectCards.forEach((card) =>
              card.classList.remove("project-entering"),
            );
            moreButton.disabled = false;
          }, 1050);
        } else {
          projectGrid.style.maxHeight = `${projectGrid.getBoundingClientRect().height}px`;
          requestAnimationFrame(() => {
            projectGrid.style.maxHeight = `${collapsedProjectHeight()}px`;
          });
          document
            .querySelector("#projects")
            .scrollIntoView({ behavior: "smooth", block: "start" });
          setTimeout(() => {
            extraProjectCards.forEach((card) => {
              card.classList.add("hidden");
              card.classList.remove("project-entering");
              card.setAttribute("aria-hidden", "true");
            });
            projectGrid.style.maxHeight = `${collapsedProjectHeight()}px`;
            moreButton.disabled = false;
          }, 820);
        }
      });
      window.addEventListener("resize", () => {
        if (moreButton.getAttribute("aria-expanded") === "false")
          projectGrid.style.maxHeight = `${collapsedProjectHeight()}px`;
      });
      const caseModal = document.querySelector("#caseModal");
      const caseTitle = document.querySelector("#caseTitle");
      const caseDescription = document.querySelector("#caseDescription");
      const caseImage = document.querySelector("#caseImage");
      const caseClose = document.querySelector("#caseClose");
      let activeProjectButton = null;
      const openCase = (card) => {
        activeProjectButton = card.querySelector(".project-open");
        const image = card.querySelector(".project-image");
        caseTitle.textContent = card.querySelector("strong").textContent;
        caseDescription.textContent =
          card.querySelector(".project-summary").textContent;
        caseImage.src = image.src;
        caseImage.alt = image.alt;
        caseModal.hidden = false;
        caseModal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
        requestAnimationFrame(() => {
          caseModal.classList.add("open");
          caseClose.focus();
        });
      };
      const closeCase = () => {
        caseModal.classList.remove("open");
        caseModal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
        const activeProjectCard = activeProjectButton?.closest(".project");
        activeProjectCard?.classList.add("suppress-hover");
        setTimeout(() => {
          caseModal.hidden = true;
          caseImage.src = "";
          activeProjectButton?.focus({ preventScroll: true });
          requestAnimationFrame(() => {
            if (activeProjectCard && !activeProjectCard.matches(":hover"))
              activeProjectCard.classList.remove("suppress-hover");
          });
        }, 260);
      };
      projectCards.forEach((card) => {
        card
          .querySelector(".project-open")
          .addEventListener("click", () => openCase(card));
        card.addEventListener("pointerleave", () =>
          card.classList.remove("suppress-hover"),
        );
      });
      caseClose.addEventListener("click", closeCase);
      caseModal.addEventListener("click", (event) => {
        if (event.target === caseModal) closeCase();
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !caseModal.hidden) closeCase();
      });
      const aboutPhotoSlider = document.querySelector(".about-photo-slider");
      const aboutPhotos = [...aboutPhotoSlider.querySelectorAll("img")];
      const aboutDots = [
        ...aboutPhotoSlider.querySelectorAll(".about-slider-dots span"),
      ];
      let aboutPhotoIndex = 0;
      const showAboutPhoto = (index) => {
        aboutPhotos[aboutPhotoIndex].classList.remove("active");
        aboutPhotos[aboutPhotoIndex].setAttribute("aria-hidden", "true");
        aboutDots[aboutPhotoIndex].classList.remove("active");
        aboutPhotoIndex = (index + aboutPhotos.length) % aboutPhotos.length;
        aboutPhotos[aboutPhotoIndex].classList.add("active");
        aboutPhotos[aboutPhotoIndex].removeAttribute("aria-hidden");
        aboutDots[aboutPhotoIndex].classList.add("active");
      };
      aboutPhotos
        .slice(1)
        .forEach((photo) => photo.setAttribute("aria-hidden", "true"));
      let aboutAutoplay;
      const startAboutAutoplay = () => {
        clearInterval(aboutAutoplay);
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
          aboutAutoplay = setInterval(
            () => showAboutPhoto(aboutPhotoIndex + 1),
            4200,
          );
      };
      const changeAboutPhoto = (direction) => {
        showAboutPhoto(aboutPhotoIndex + direction);
        startAboutAutoplay();
      };
      let aboutPointerStart = 0;
      let aboutWasDragged = false;
      aboutPhotoSlider.addEventListener("pointerdown", (event) => {
        aboutPointerStart = event.clientX;
        aboutWasDragged = false;
        aboutPhotoSlider.classList.add("dragging");
        aboutPhotoSlider.setPointerCapture(event.pointerId);
      });
      aboutPhotoSlider.addEventListener("pointermove", (event) => {
        if (!aboutPointerStart) return;
        if (Math.abs(event.clientX - aboutPointerStart) > 12)
          aboutWasDragged = true;
      });
      aboutPhotoSlider.addEventListener("pointerup", (event) => {
        if (!aboutPointerStart) return;
        const distance = event.clientX - aboutPointerStart;
        aboutPointerStart = 0;
        aboutPhotoSlider.classList.remove("dragging");
        if (Math.abs(distance) > 45) changeAboutPhoto(distance < 0 ? 1 : -1);
      });
      aboutPhotoSlider.addEventListener("click", () => {
        aboutWasDragged = false;
      });
      let aboutWheelLocked = false;
      aboutPhotoSlider.addEventListener(
        "wheel",
        (event) => {
          if (
            Math.abs(event.deltaX) <= Math.abs(event.deltaY) ||
            aboutWheelLocked
          )
            return;
          event.preventDefault();
          aboutWheelLocked = true;
          changeAboutPhoto(event.deltaX > 0 ? 1 : -1);
          setTimeout(() => {
            aboutWheelLocked = false;
          }, 450);
        },
        { passive: false },
      );
      startAboutAutoplay();

