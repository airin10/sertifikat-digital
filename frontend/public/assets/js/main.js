(function() {
    /* ====================
    Preloader
    ======================= */
    window.onload = function () {
        window.setTimeout(fadeout, 300);
    }

    function fadeout() {
        const preloader = document.querySelector('.preloader');
        if (preloader) {
            preloader.style.opacity = '0';
            preloader.style.display = 'none';
        }
    }

    // =========== sticky menu 
    window.onscroll = function () {
        // PERBAIKAN: Gunakan selector yang ada di App.js kamu (.header-6)
        var header_navbar = document.querySelector(".header-6");
        
        // PERBAIKAN: Cek apakah elemen ada sebelum ambil offsetTop
        if (header_navbar) {
            var sticky = header_navbar.offsetTop;
            if (window.pageYOffset > sticky) {
                header_navbar.classList.add("sticky");
            } else {
                header_navbar.classList.remove("sticky");
            }
        }

        // show or hide the back-top-top button
        var backToTo = document.querySelector(".scroll-top");
        if (backToTo) { // PERBAIKAN: Cek apakah tombol ada
            if (document.body.scrollTop > 50 || document.documentElement.scrollTop > 50) {
                backToTo.style.display = "flex";
            } else {
                backToTo.style.display = "none";
            }
        }
    };

    // header-6 toggler-icon
    // PERBAIKAN: Gunakan penanganan error jika tombol menu tidak ditemukan
    window.addEventListener('click', function(e) {
        let navbarToggler6 = document.querySelector(".header-6 .navbar-toggler");
        var navbarCollapse6 = document.querySelector(".header-6 .navbar-collapse");
        
        if (navbarToggler6 && navbarCollapse6) {
            if (e.target.classList.contains("page-scroll")) {
                navbarToggler6.classList.remove("active");
                navbarCollapse6.classList.remove('show');
            }
        }
    });

    // WOW active
    // PERBAIKAN: Pastikan WOW ada sebelum init
    if (typeof WOW !== 'undefined') {
        new WOW().init();
    }

    // PERBAIKAN: Pricing slider biasanya butuh library Tiny Slider (tns)
    // Jika tidak pakai slider ini di skripsi, bagian ini bisa dihapus atau dibungkus if
    if (document.querySelector('.pricing-active') && typeof tns !== 'undefined') {
        tns({
            container: '.pricing-active',
            autoplay: false,
            mouseDrag: true,
            gutter: 0,
            nav: false,
            controls: true,
            controlsText: [
              '<i class="lni lni-chevron-left prev"></i>',
              '<i class="lni lni-chevron-right prev"></i>',
            ],
            responsive: {
              0: { items: 1 },
              768: { items: 2 },
              992: { items: 1.2 },
              1200: { items: 2 }
            }
        });
    }
})();