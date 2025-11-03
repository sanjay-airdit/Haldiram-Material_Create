sap.ui.define(
    [
      "sap/ui/core/mvc/Controller"
    ],
    function (BaseController) {
      "use strict";
  
      return BaseController.extend("zmaterialcreate.materialcreate.customComponents.comp1.controller.App", {
        onInit: function () {
        },
        patternMatch: function (oEvent) {
          this.refreshIframe();
        },
        refreshIframe: function () {
          var oHtmlControl = this.getView().byId("iframeObjectPage");
          oHtmlControl.setContent(this.formatIframeSrc());
        },
      });
    }
  );
  