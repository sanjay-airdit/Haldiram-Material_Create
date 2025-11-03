sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/suite/ui/generic/template/extensionAPI/ReuseComponentSupport"
], (UIComponent, ReuseComponentSupport) => {
    "use strict";

    return UIComponent.extend("zmaterialcreate.materialcreate.customComponents.comp1.Component", {
        metadata: {
            manifest: "json",
            config: {
                "routerClass": "sap.f.routing.Router",
                "viewReuse": false // 🔥 This forces full reload of views on navigation
            }
        },
        init: function () {
            // call the base component's init function  

            ReuseComponentSupport.mixInto(this, "component");
            (UIComponent.prototype.init || jQuery.noop).apply(this, arguments);

        },


        stRefresh: function (oModel, oBindingContext, oExtensionAPI) {
            const oNav = oExtensionAPI.getNavigationController();
            const aKeys = oNav.getCurrentKeys();
            const sBaseUrl = window.location.origin;
            const sUrl = `${sBaseUrl}/sap/bc/ui5_ui5/sap/zaidgmytask2/index.html`
            this._setIframeModel(sUrl);
        },
        _setIframeModel: function (sIframeUrl) {
            const sHtml = `<iframe src="${sIframeUrl}" class="iFrameClass" loading="eager" allowfullscreen="true"></iframe>`;
            const oHtmlModel = new sap.ui.model.json.JSONModel({ HtmlContent: sHtml });
            this.setModel(oHtmlModel, "oHtmlModel");
        }
    });
});