/*RetailPulse - frontend/js/tailwind-config.js*/
const font = ["Inter"];
tailwind.config = {
    darkMode: "class",
    theme: { 
        extend: {
            colors: {
                "secondary-container":"#6cf8bb",
                "error-container":"#ffdad6",
                "on-primary-fixed":"#0f0069",
                "secondary":"#006c49",
                "on-surface-variant":"#464555",
                "background":"#f8f9ff",
                "secondary-fixed-dim":"#4edea3",
                "on-secondary-container":"#00714d",
                "surface-tint":"#4d44e3",
                "on-tertiary-fixed-variant":"#653e00",
                "outline":"#777587",
                "surface-dim":"#cbdbf5",
                "tertiary":"#684000",
                "surface-container-high":"#dce9ff",
                "surface-container-lowest":"#ffffff",
                "surface-container-low":"#eff4ff",
                "primary-fixed":"#e2dfff",
                "on-primary":"#ffffff",
                "on-primary-fixed-variant":"#3323cc",
                "primary-container":"#4f46e5",
                "tertiary-fixed":"#ffddb8",
                "on-tertiary-fixed":"#2a1700",
                "surface-container-highest":"#d3e4fe",
                "outline-variant":"#c7c4d8",
                "on-error":"#ffffff",
                "on-primary-container":"#dad7ff",
                "on-surface":"#0b1c30",
                "error":"#ba1a1a",
                "on-error-container":"#93000a",
                "surface-container":"#e5eeff",
                "tertiary-container":"#885500",
                "surface":"#f8f9ff",
                "on-secondary":"#ffffff",
                "on-tertiary":"#ffffff",
                "primary":"#3525cd",
                "secondary-fixed":"#6ffbbe",
                "tertiary-fixed-dim":"#ffb95f"
            },
        borderRadius: {
            DEFAULT:"0.25rem",
            lg:"0.5rem",
            xl:"0.75rem",
            full:"9999px"
        },

        spacing: {
            "space-xs":"0.25rem",
            "space-sm":"0.5rem",
            "space-md":"1rem",
            "space-lg":"1.5rem",
            "space-xl":"2rem",
            gutter:"1.5rem"
        },
        
        fontFamily: Object.fromEntries(["body-md","body-sm","label-sm","label-md","title-sm","title-md","headline-sm","headline-md","headline-lg","display","numeric-table"].map(k => [k, font])),
        
        fontSize: {
            "body-md":
                ["14px",{lineHeight:"20px",fontWeight:"400"}], 
                "body-sm":["12px",{lineHeight:"16px",fontWeight:"400"}],
            "label-sm":
                ["11px",{lineHeight:"14px",letterSpacing:"0.04em",fontWeight:"600"}], 
            "label-md":
                ["13px",{lineHeight:"18px",fontWeight:"500"}],
            "title-sm":
                ["14px",{lineHeight:"20px",fontWeight:"600"}], 
            "title-md":
                ["16px",{lineHeight:"24px",fontWeight:"600"}],
            "headline-sm":
                ["20px",{lineHeight:"28px",fontWeight:"600"}], 
            "headline-md":
                ["24px",{lineHeight:"32px",fontWeight:"600"}],
            "headline-lg":
                ["30px",{lineHeight:"38px",fontWeight:"600"}], 
            "display":
                ["36px",{lineHeight:"44px",fontWeight:"700"}],
            "numeric-table":
                ["14px",{lineHeight:"20px",fontWeight:"500"}]
        }
    }}
};