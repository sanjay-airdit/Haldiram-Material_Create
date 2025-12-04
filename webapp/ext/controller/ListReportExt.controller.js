sap.ui.define([
    "sap/m/MessageToast",
    "sap/ui/core/routing/History",
    "sap/m/MessageBox",
], function (MessageToast, History, MessageBox) {
    'use strict';

    return {
        onInit: function () {
            let oRouter = this.getOwnerComponent().getRouter();
            //oRouter.attachRouteMatched(this.onRouteMatched, this);
            let oStartUpParamsModel = this.getOwnerComponent().getModel('StartUpParamsModel');
            if (oStartUpParamsModel && oStartUpParamsModel.getData().isNavigatingFromExternal) {
                this.getView().setVisible(false)
            }
        },
        // onRouteMatched: function (oEvent) {
        //     debugger
        //     let sRoute = oEvent.getParameter('name')
        //     console.log(oEvent.getParameter("arguments"))

        // },
        onAfterRendering: function () {
            let oCreateBtn0 = this.getView().byId(this.getView().getId() + '--addEntry-tab0')
            let oCreateBtn1 = this.getView().byId(this.getView().getId() + '--addEntry-tab1')
            let oCopyBtn1 = this.getView().byId(this.getView().getId() + '--copyButton-tab1')
            oCreateBtn0.setVisible(false)
            oCreateBtn1.setVisible(false)
            oCopyBtn1.setVisible(false)

            let oButtonCustomsearch = this.getView().byId("zmaterialcreate.materialcreate::sap.suite.ui.generic.template.ListReport.view.ListReport::ZP_QU_DG_MARA_MASSREQ--action::idCustomSearchButton")
            oButtonCustomsearch.setType("Neutral")
            oButtonCustomsearch.setIcon('sap-icon://search')
        },

        onCreate: async function (oEvent) {
            let that = this;
            that.getView().setBusy(true)
            try {
                let oApi = this.extensionAPI;
                let aResponse = await oApi.invokeActions("/create_request", [], {});
                if (aResponse[0] && aResponse[0].response) {
                    let sReqId = aResponse[0].response.response.data.reqid;
                    let oResponseContext = aResponse[0].response.context;
                    this._ContextPath = aResponse[0].response.context.getDeepPath()

                    //OPENING THE DIALOG
                    if (!this.CreateDialog) {
                        this.CreateDialog = sap.ui.xmlfragment(this.getView().getId(), "zmaterialcreate.materialcreate.ext.fragment.Create", this);
                        this.getView().addDependent(this.CreateDialog);
                    }
                    this.CreateDialog.setEscapeHandler(this.onPressEscapeButton.bind(this));



                    //SETTING BINDING CONTEXT
                    this.CreateDialog.setBindingContext(oResponseContext)
                    this.CreateDialog.open();
                    that.getView().setBusy(false)
                }
            } catch (oErr) {
                that.getView().setBusy(true)
                console.error(oErr)
            }

        },

        handleCreate: async function (oEvent) {
            let that = this;
            let oModel = this.getOwnerComponent().getModel()
            let oSmartForm = this.byId('idCreateSmartForm')
            let oMaterialTypeField = this.byId('create:Mtart')
            let aErrorFields = await oSmartForm.check()

            if (oMaterialTypeField.getProperty('value').length > 0 && aErrorFields.length === 0) {
                this.CreateDialog.setBusy(true)
                let oApi = this.extensionAPI;
                let sPath = this._ContextPath
                let sSno = this.CreateDialog.getBindingContext().getObject().SNo
                // let sMatnr = this.CreateDialog.getBindingContext().getObject().matnr
                let IsActiveEntity = this.CreateDialog.getBindingContext().getObject().IsActiveEntity
                let sMtart = this.CreateDialog.getBindingContext().getObject().Mtart
                let sReqid = this.CreateDialog.getBindingContext().getObject().Reqid
                let sReqtyp = this.CreateDialog.getBindingContext().getObject().reqtyp
                var oPromise = oApi.invokeActions("/check_screen_and_workflow", [], { SNo: sSno, Reqid: sReqid, Matnr: "", Mtart: sMtart, reqtyp: sReqtyp, IsActiveEntity: IsActiveEntity });
                oPromise
                    .then(function (aResponse) {
                        debugger;
                        let sSeverity = JSON.parse(aResponse[0].response.response.headers["sap-message"]).severity;
                        if (sSeverity === "success") {
                            debugger;
                            let oContextToNavigate = new sap.ui.model.Context(oModel, sPath);
                            let oNavController = oApi.getNavigationController();
                            debugger;
                            let oPayload = {
                                Mtart: sMtart
                            }

                            oModel.update(sPath, oPayload, {
                                success: function (oData, oResponse) {
                                    that.CreateDialog.setBusy(false)
                                    oModel.read(sPath, {
                                        success: function (oData, oResponse) {
                                            oNavController.navigateInternal(oContextToNavigate);
                                        },
                                        error: function (oErr) {
                                            that.CreateDialog.setBusy(false)
                                            console.error(oErr)
                                        }
                                    });

                                },
                                error: function (oErr) {
                                    that.CreateDialog.setBusy(false)
                                    console.error(oErr)
                                }
                            }
                            );
                        } else {
                            let sErrorMessage = JSON.parse(aResponse[0].response.response.headers["sap-message"]).message;
                            sap.m.MessageBox.error(sErrorMessage);
                            that.CreateDialog.setBusy(false);
                        }
                        // let sPath = this._ContextPath

                    })
                    .catch(function (oError) {
                        debugger;
                    })

                // let sMtart = this.CreateDialog.getBindingContext().getObject().Mtart
                // let sReqid = this.CreateDialog.getBindingContext().getObject().Reqid
                // let sReqtyp = this.CreateDialog.getBindingContext().getObject().reqtyp
                // let sPath = this._ContextPath
                // let oContextToNavigate = new sap.ui.model.Context(oModel, sPath);
                // let oNavController = this.extensionAPI.getNavigationController();
                // debugger;
                // let oPayload = {
                //     Mtart: sMtart
                // }

                // oModel.update(sPath, oPayload, {
                //     success: function (oData, oResponse) {
                //         this.CreateDialog.setBusy(false)
                //         oModel.read(sPath, {
                //             success: function (oData, oResponse) {
                //                 oNavController.navigateInternal(oContextToNavigate);
                //             }.bind(this),
                //             error: function (oErr) {
                //                 this.CreateDialog.setBusy(false)
                //                 console.error(oErr)
                //             }.bind(this)
                //         });

                //     }.bind(this),
                //     error: function (oErr) {
                //         this.CreateDialog.setBusy(false)
                //         console.error(oErr)
                //     }.bind(this)
                // }
                // );

            } else {
                this.CreateDialog.setBusy(false)
                oMaterialTypeField.setValueState('Error')
            }


        },

        onCloseDialog: function (oEvent) {
            this._DeleteRequest()
            this.CreateDialog.close();
        },

        onPressEscapeButton: function (oEvent) {
            this._DeleteRequest()
            this.CreateDialog.close();
            oEvent.resolve();
        },

        _DeleteRequest: function () {
            let oData = this.CreateDialog.getBindingContext().getObject()
            let oApi = this.extensionAPI;
            let oPromise = oApi.invokeActions("/ZP_QU_DG_MARA_MASSREQDiscard", [], {
                SNo: oData.SNo,
                Reqid: oData.Reqid,
                Matnr: '',
                IsActiveEntity: oData.IsActiveEntity
            });
            oPromise.then(() => {

            })
        },

        onCopy: async function (oEvent) {
            this.getView().setBusy(true)
            const oModel = this.getView().getModel();
            let that = this;
            let oApi = this.extensionAPI;
            let sMatnr = oApi.getSelectedContexts()[0].getObject().Matnr
            let sSno = oApi.getSelectedContexts()[0].getObject().SNo
            let sReqId = oApi.getSelectedContexts()[0].getObject().Reqid
            let sReqtyp = "COPY";
            let sMtart = oApi.getSelectedContexts()[0].getObject().Mtart
            let IsActiveEntity = oApi.getSelectedContexts()[0].getObject().IsActiveEntity
            var aCheckResponse = await oApi.invokeActions("/check_screen_and_workflow", [], { SNo: sSno, Reqid: sReqId, Matnr: sMatnr, Mtart: sMtart, reqtyp: sReqtyp, IsActiveEntity: IsActiveEntity });
            let sSeverity = JSON.parse(aCheckResponse[0].response.response.headers["sap-message"]).severity;
            if (sSeverity === "success") {
                debugger;
                let aPayload = {
                    Matnr: sMatnr,
                    IsCopy: true,
                    IsDelete: false
                }

                try {
                    let aResponse = await oApi.invokeActions("/create_update_request", [], aPayload);
                    debugger;
                    if (aResponse[0] && aResponse[0].response) {

                        let sContextPath = aResponse[0].response.context.getDeepPath()
                        let oContextToNavigate = new sap.ui.model.Context(oModel, sContextPath);
                        let oNavController = this.extensionAPI.getNavigationController()
                        that.getView().setBusy(false)
                        oNavController.navigateInternal(oContextToNavigate);

                    }
                } catch (oErr) {
                    that.getView().setBusy(true)
                    console.error(oErr)
                }
            } else {
                let sErrorMessage = JSON.parse(aCheckResponse[0].response.response.headers["sap-message"]).message;
                sap.m.MessageBox.error(sErrorMessage);
                that.getView().setBusy(false);
            }
            // let aPayload = {
            //     Matnr: sMatnr,
            //     IsCopy: true,
            //     IsDelete: false
            // }

            // try {
            //     let aResponse = await oApi.invokeActions("/create_update_request", [], aPayload);
            //     debugger;
            //     if (aResponse[0] && aResponse[0].response) {

            //         let sContextPath = aResponse[0].response.context.getDeepPath()
            //         let oContextToNavigate = new sap.ui.model.Context(oModel, sContextPath);
            //         let oNavController = this.extensionAPI.getNavigationController()
            //         this.getView().setBusy(false)
            //         oNavController.navigateInternal(oContextToNavigate);

            //     }
            // } catch (oErr) {
            //     this.getView().setBusy(true)
            //     console.error(oErr)
            // }
        },

        // R0421
        onBeforeRebindTableExtension: function (oEvent) {

            //PASSING FILTER PARAMETER TO GET ONLY AUTHORISED REQUESTS
            //PASSING SORTING PARAMETER

            let sTable2 = this.getView().createId("listReport-tab0");
            let sTable1 = this.getView().createId("listReport-tab1");
            // oEvent.getSource().deactivateColumns(['mbrsh']);
            let sTableId = oEvent.getSource().getId()
            if (sTableId === sTable1) {
                let aColumns = oEvent.getSource()._aColumnKeys
                let fieldsToShow = ['Reqid', 'maktx', 'reqtyp', 'req_desc', 'reqprio', 'req_created_by', 'req_created_on', 'DraftEntityLastChangeDateTime', 'req_status', 'CreatedAtTime'];
                let filteredArray = aColumns.filter((field) => {
                    return !fieldsToShow.includes(field)
                })
                //console.log(filteredArray)
                oEvent.getSource().deactivateColumns(filteredArray);

                //PASSING CUSTON REQUESTS FILTER
                if (this.Requests && this.Requests.length > 0) {
                    let aFilters = []
                    this.Requests.map((item) => {
                        aFilters.push(new sap.ui.model.Filter("Reqid", "EQ", item))
                    })
                    let oFilter = new sap.ui.model.Filter({
                        filters: aFilters,
                        and: false
                    })
                    oEvent.getParameter("bindingParams").filters.push(oFilter);
                } else if (this.Requests && this.Requests.length === 0) {
                    let oFilter = new sap.ui.model.Filter({
                        filters: [new sap.ui.model.Filter("Reqid", "EQ", 'none')],
                        and: true
                    })
                    oEvent.getParameter("bindingParams").filters.push(oFilter)
                }

                //PASSING FILTER PARAMETER TO GET ONLY AUTHORISED REQUESTS
                //oEvent.getParameter("bindingParams").filters.push(new sap.ui.model.Filter("RequestByLoggedinUser", "EQ", 'X'))
                //PASSING SORTING PARAMETER
                oEvent.getParameter("bindingParams").sorter.push(new sap.ui.model.Sorter("DraftEntityLastChangeDateTime", true));
                oEvent.getParameter("bindingParams").sorter.push(new sap.ui.model.Sorter("req_created_on", true));
                oEvent.getParameter("bindingParams").sorter.push(new sap.ui.model.Sorter("CreatedAtTime", true));
            }
            if (sTableId === sTable2) {
                let bColumns = oEvent.getSource()._aColumnKeys
                let fieldsToShowTab2 = ['Matnr', 'maktx', 'Mtart', 'Mbrsh', 'Reqid', 'reqtyp', 'req_desc', 'reqprio', 'Ersda', 'Laeda', 'CreatedAtTime'];
                let filteredArraytab2 = bColumns.filter((field) => {
                    return !fieldsToShowTab2.includes(field)
                })
                //console.log(filteredArray)
                oEvent.getSource().deactivateColumns(filteredArraytab2)

                //PASSING CUSTOM MATERIAL FILTER
                if (this.Materials && this.Materials.length > 0) {
                    let aFilters = []
                    this.Materials.map((item) => {
                        aFilters.push(new sap.ui.model.Filter("Matnr", "EQ", item))
                    })
                    let oFilter = new sap.ui.model.Filter({
                        filters: aFilters,
                        and: false
                    })
                    oEvent.getParameter("bindingParams").filters.push(oFilter);
                } else if (this.Materials && this.Materials.length === 0) {
                    let oFilter = new sap.ui.model.Filter({
                        filters: [new sap.ui.model.Filter("Matnr", "EQ", 'none')],
                        and: true
                    })
                    oEvent.getParameter("bindingParams").filters.push(oFilter)
                }
            }
        },

        //CUSTOM SEARCH
        handleCustomSearch: function (oEvent) {
            let oModel = this.getOwnerComponent().getModel('SearchMaterialByChar')
            let oCustomSearchDialog = this.getView().byId("idCustomSearch");
            if (!oCustomSearchDialog) {
                oCustomSearchDialog = sap.ui.xmlfragment(this.getView().getId(), "zmaterialcreate.materialcreate.ext.fragment.CustomSearchByCharClass", this);
                this.getView().addDependent(oCustomSearchDialog);
            }
            oCustomSearchDialog.setModel(oModel)
            oCustomSearchDialog.setEscapeHandler(this.onPressEscapeButton.bind(this));
            oCustomSearchDialog.open();
        },

        onAddTableRow: function () {
            let oModel = this.getOwnerComponent().getModel("SearchMaterialByChar");
            var oTable = this.getView().byId("idTable");
            debugger;
            var oNewColumnListItem = new sap.m.ColumnListItem({
                cells: [
                    new sap.ui.comp.smartfield.SmartField({
                        entitySet: "ZC_QU_DG_MatClassUnion",
                        value: "{class}",
                    }),
                    new sap.ui.comp.smartfield.SmartField({
                        entitySet: "ZC_QU_DG_MatClassUnion",
                        value: "{atnam}",
                    }),
                    new sap.ui.comp.smartfield.SmartField({
                        entitySet: "ZC_QU_DG_MatClassUnion",
                        value: "{atwrtValue}",

                    }),
                    new sap.m.Button({
                        type: "Transparent",
                        icon: "sap-icon://decline",
                        press: this.onRemoveTableRow.bind(this)
                    })
                ]
            }).setBindingContext(oModel.createEntry("/ZC_QU_DG_MatClassUnion", {}));
            //let oModel = this.getOwnerComponent().getModel("SearchMaterialByChar");
            //let oContext = oModel.createEntry("/ZC_QU_DG_MatClassUnion", {});
            // oNewItem.getCells().forEach((cell)=>{
            //     cell.setBindingContext(oContext)
            // })
            //oNewColumnListItem.setBindingContext(oContext);
            oTable.addItem(oNewColumnListItem);
        },

        onRemoveTableRow: function (oEvent) {
            let oButton = oEvent.getSource();
            let oItem = oButton.getParent();
            let oTable = this.getView().byId("idTable");
            oTable.removeItem(oItem);
        },

        onDialogSearch: function (oEvent) {
            let oCustomSearchDialog = this.getView().byId("idCustomSearch")
            let oModel = this.getOwnerComponent().getModel('SearchMaterialByChar')
            let aCharacteristics = this._GetCharTableData()
            //let sCharClassName = this.getView().byId("idSearchField").getValue()

            //PREPARING ODATA Read Parameters//
            let oReadParameters = {
                success: function (oData, oRes) {
                    oCustomSearchDialog.setBusy(false)
                    oCustomSearchDialog.close()
                    let aMaterials = []
                    let aRequests = []
                    oData.results.forEach((item) => {
                        if (item.matnr.length > 0) {
                            aMaterials.push(item.matnr);
                        }
                        if (item.reqid.length > 0) {
                            aRequests.push(item.reqid);
                        }
                    })
                    let oCustomSearchResults = {
                        Materials: [...new Set(aMaterials)],
                        Requests: [...new Set(aRequests)]
                    }
                    debugger;
                    this._PassCustomFilters(oCustomSearchResults)

                }.bind(this),
                error: function (oErr) { console.warn(oErr); debugger },
            }

            //ADDING FILTER PARAMETER IF FILTERS ARE PRESENT
            if (aCharacteristics.length > 0) {
                let aFilters = []
                aCharacteristics.forEach((item) => {
                    let oFilter = new sap.ui.model.Filter({
                        filters: [
                            new sap.ui.model.Filter("class", "EQ", item.ClassName),
                            new sap.ui.model.Filter("atnam", "EQ", item.CharacteristicsName),
                            new sap.ui.model.Filter("atwrtValue", "Contains", item.CharacteristicsValue)
                        ],
                        and: true
                    })
                    aFilters.push(oFilter)
                })
                let oCombinedFilter = new sap.ui.model.Filter({
                    filters: aFilters,
                    and: false
                });
                oReadParameters.filters = [oCombinedFilter]
            }

            //ADDING URL PARAMETERS IF SEARCH PARAMETER IS PRESENT
            // if (sCharClassName && sCharClassName.length > 0) {
            //     oReadParameters.urlParameters = {
            //         search: sCharClassName
            //     }
            // }

            //MAKING GET CALL
            if (aCharacteristics.length > 0) {
                oCustomSearchDialog.setBusy(true)
                oModel.read('/ZC_QU_DG_MatClassUnion', oReadParameters)
            } else {
                debugger;
                let oSmartFilterBar = this.getView().byId('listReportFilter')
                oCustomSearchDialog.close()
                let oSearchData = {
                    matnr: {
                        items: [],
                    },
                    reqid: {
                        items: [],
                    },
                }

                this.Materials = null;
                this.Requests = null;
                oSmartFilterBar.setFilterData(oSearchData)
                oSmartFilterBar.search()

            }
        },

        _GetCharTableData: function (oEvent) {
            let oTable = this.getView().byId("idTable");
            let aItems = oTable.getItems();
            let aResults = [];
            aItems.forEach(function (oItem) {
                // Get the cells in the current row
                let aCells = oItem.getCells();
                let oRowData = {}
                // Loop through each cell and get the value from SmartField

                aCells.forEach(function (oCell, index) {
                    if (oCell instanceof sap.ui.comp.smartfield.SmartField) {
                        let sValue = oCell.getValue();
                        if (sValue && sValue.length > 0) {
                            if (index === 0) {
                                oRowData.ClassName = sValue;
                            } else if (index === 1) {
                                oRowData.CharacteristicsName = sValue;
                            } else if (index === 2) {
                                oRowData.CharacteristicsValue = sValue;
                            }
                        }
                    }
                });
                // Add the row data to the results array
                if (Object.keys(oRowData).length > 0) {
                    aResults.push(oRowData)
                }
            });
            return aResults
        },

        _PassCustomFilters: function (data) {
            this.Materials = data.Materials
            this.Requests = data.Requests
            let sMaterialsTable = this.getView().byId("listReport-tab0");
            let sRequestsTable = this.getView().byId("listReport-tab1");
            debugger;
            sMaterialsTable.rebindTable()
            sRequestsTable.rebindTable()
        },

        onCloseCustomSearchDialog: function (oEvent) {
            let oCustomSearchDialog = this.getView().byId("idCustomSearch")
            oCustomSearchDialog.close();
        },
    }
});
// sap.ui.controller("zmaterialcreate.materialcreate.ext.controller.ListReportExt", {


//     onInit: function (oController) {
//         oButtonCustomsearch = this.getView().byId("zmaterialcreate.materialcreate::sap.suite.ui.generic.template.ListReport.view.ListReport::ZP_QU_DG_MARA_MASSREQ--action::idCustomSearchButton")
//         oButtonCustomsearch.setType("Neutral")
//         oButtonCustomsearch.setIcon('sap-icon://search')
//     },
//     onAfterRendering: function () {
//         let oCreateBtn0 = this.getView().byId(this.getView().getId() + '--addEntry-tab0')
//         let oCreateBtn1 = this.getView().byId(this.getView().getId() + '--addEntry-tab1')
//         let oCopyBtn1 = this.getView().byId(this.getView().getId() + '--copyButton-tab1')
//         oCreateBtn0.setVisible(false)
//         oCreateBtn1.setVisible(false)
//         oCopyBtn1.setVisible(false)
//     },

//     onCreate: async function (oEvent) {
//         let that = this;
//         that.getView().setBusy(true)
//         try {
//             let oApi = this.extensionAPI;
//             let aResponse = await oApi.invokeActions("/create_request", [], {});
//             if (aResponse[0] && aResponse[0].response) {
//                 let sReqId = aResponse[0].response.response.data.reqid;
//                 let oResponseContext = aResponse[0].response.context;
//                 this._ContextPath = aResponse[0].response.context.getDeepPath()

//                 //OPENING THE DIALOG
//                 if (!this.CreateDialog) {
//                     this.CreateDialog = sap.ui.xmlfragment(this.getView().getId(), "zmaterialcreate.materialcreate.ext.fragment.Create", this);
//                     this.getView().addDependent(this.CreateDialog);
//                 }
//                 this.CreateDialog.setEscapeHandler(this.onPressEscapeButton.bind(this));



//                 //SETTING BINDING CONTEXT
//                 this.CreateDialog.setBindingContext(oResponseContext)
//                 this.CreateDialog.open();
//                 that.getView().setBusy(false)
//             }
//         } catch (oErr) {
//             that.getView().setBusy(true)
//             console.error(oErr)
//         }

//     },

//     handleCreate: async function (oEvent) {
//         this.CreateDialog.setBusy(true)

//         let oModel = this.getOwnerComponent().getModel()
//         let oSmartForm = this.byId('idCreateSmartForm')
//         let aErrorFields = await oSmartForm.check()
//         if (aErrorFields.length === 0) {
//             let sMtart = this.CreateDialog.getBindingContext().getObject().Mtart
//             let sReqid = this.CreateDialog.getBindingContext().getObject().Reqid
//             let sReqtyp = this.CreateDialog.getBindingContext().getObject().reqtyp
//             let sPath = this._ContextPath
//             let oContextToNavigate = new sap.ui.model.Context(oModel, sPath);
//             let oNavController = this.extensionAPI.getNavigationController();
//             debugger;
//             let oPayload = {
//                 Mtart: sMtart
//             }

//             oModel.update(sPath, oPayload, {
//                 success: function (oData, oResponse) {
//                     oModel.read(sPath, {
//                         success: function (oData, oResponse) {
//                             this.CreateDialog.setBusy(false)
//                             oNavController.navigateInternal(oContextToNavigate);
//                         }.bind(this),
//                         error: function (oErr) {
//                             this.CreateDialog.setBusy(false)
//                             console.error(oErr)
//                         }.bind(this)
//                     });

//                 }.bind(this),
//                 error: function (oErr) {
//                     this.CreateDialog.setBusy(false)
//                     console.error(oErr)
//                 }.bind(this)
//             }
//             );

//         } else {
//             MessageBox.error("Please fill required fields..!!")
//         }

//     },

//     onCloseDialog: function (oEvent) {
//         this._DeleteRequest()
//         this.CreateDialog.close();
//     },

//     onPressEscapeButton: function (oEvent) {
//         this._DeleteRequest()
//         this.CreateDialog.close();
//         oEvent.resolve();
//     },

//     _DeleteRequest: function () {
//         let oData = this.CreateDialog.getBindingContext().getObject()
//         let oApi = this.extensionAPI;
//         let oPromise = oApi.invokeActions("/ZP_QU_DG_MARA_MASSREQDiscard", [], {
//             SNo: oData.SNo,
//             Reqid: oData.Reqid,
//             Matnr: '',
//             IsActiveEntity: oData.IsActiveEntity
//         });
//         oPromise.then(() => {

//         })
//     },

//     onCopy: async function (oEvent) {
//         this.getView().setBusy(true)
//         const oModel = this.getView().getModel();

//         let oApi = this.extensionAPI;
//         let sMatnr = oApi.getSelectedContexts()[0].getObject().Matnr
//         let aPayload = {
//             Matnr: sMatnr,
//             IsCopy: true,
//             IsDelete: false
//         }

//         try {
//             let aResponse = await oApi.invokeActions("/create_update_request", [], aPayload);
//             debugger;
//             if (aResponse[0] && aResponse[0].response) {

//                 let sContextPath = aResponse[0].response.context.getDeepPath()
//                 let oContextToNavigate = new sap.ui.model.Context(oModel, sContextPath);
//                 let oNavController = this.extensionAPI.getNavigationController()
//                 this.getView().setBusy(false)
//                 oNavController.navigateInternal(oContextToNavigate);

//             }
//         } catch (oErr) {
//             this.getView().setBusy(true)
//             console.error(oErr)
//         }
//     },

//     // R0421
//     onBeforeRebindTableExtension: function (oEvent) {

//         //PASSING FILTER PARAMETER TO GET ONLY AUTHORISED REQUESTS
//         //PASSING SORTING PARAMETER
//         oEvent.getParameter("bindingParams").sorter.push(new sap.ui.model.Sorter("DraftEntityLastChangeDateTime", true));
//         oEvent.getParameter("bindingParams").sorter.push(new sap.ui.model.Sorter("req_created_on", true));

//         let sTable2 = this.getView().createId("listReport-tab0");
//         let sTable1 = this.getView().createId("listReport-tab1");
//         // oEvent.getSource().deactivateColumns(['mbrsh']);
//         let sTableId = oEvent.getSource().getId()
//         if (sTableId === sTable1) {
//             debugger;
//             let aColumns = oEvent.getSource()._aColumnKeys
//             let fieldsToShow = ['Reqid', 'reqtyp', 'req_desc', 'reqprio', 'req_created_by', 'req_created_on', 'DraftEntityLastChangeDateTime', 'req_status'];
//             let filteredArray = aColumns.filter((field) => {
//                 return !fieldsToShow.includes(field)
//             })
//             //console.log(filteredArray)
//             oEvent.getSource().deactivateColumns(filteredArray);

//             //PASSING CUSTON REQUESTS FILTER
//             if (this.Requests && this.Requests.length > 0) {
//                 debugger;
//                 let aFilters = []
//                 this.Requests.map((item) => {
//                     aFilters.push(new sap.ui.model.Filter("Reqid", "EQ", item))
//                 })
//                 let oFilter = new sap.ui.model.Filter({
//                     filters: aFilters,
//                     and: false
//                 })
//                 oEvent.getParameter("bindingParams").filters.push(oFilter);
//             } else if (this.Requests && this.Requests.length === 0) {
//                 let oFilter = new sap.ui.model.Filter({
//                     filters: [new sap.ui.model.Filter("Reqid", "EQ", 'none')],
//                     and: true
//                 })
//                 oEvent.getParameter("bindingParams").filters.push(oFilter)
//             }

//             //PASSING FILTER PARAMETER TO GET ONLY AUTHORISED REQUESTS
//             //oEvent.getParameter("bindingParams").filters.push(new sap.ui.model.Filter("RequestByLoggedinUser", "EQ", 'X'))
//             //PASSING SORTING PARAMETER
//             oEvent.getParameter("bindingParams").sorter.push(new sap.ui.model.Sorter("DraftEntityLastChangeDateTime", true));
//             oEvent.getParameter("bindingParams").sorter.push(new sap.ui.model.Sorter("req_created_on", true));
//         }
//         if (sTableId === sTable2) {
//             debugger;

//             let bColumns = oEvent.getSource()._aColumnKeys
//             let fieldsToShowTab2 = ['Matnr', 'maktx', 'Mtart', 'Mbrsh', 'Reqid', 'reqtyp', 'req_desc', 'reqprio', 'Ersda', 'Laeda'];
//             let filteredArraytab2 = bColumns.filter((field) => {
//                 return !fieldsToShowTab2.includes(field)
//             })
//             //console.log(filteredArray)
//             oEvent.getSource().deactivateColumns(filteredArraytab2)

//             //PASSING CUSTOM MATERIAL FILTER
//             if (this.Materials && this.Materials.length > 0) {
//                 let aFilters = []
//                 this.Materials.map((item) => {
//                     aFilters.push(new sap.ui.model.Filter("Matnr", "EQ", item))
//                 })
//                 let oFilter = new sap.ui.model.Filter({
//                     filters: aFilters,
//                     and: false
//                 })
//                 oEvent.getParameter("bindingParams").filters.push(oFilter);
//             } else if (this.Materials && this.Materials.length === 0) {
//                 let oFilter = new sap.ui.model.Filter({
//                     filters: [new sap.ui.model.Filter("Matnr", "EQ", 'none')],
//                     and: true
//                 })
//                 oEvent.getParameter("bindingParams").filters.push(oFilter)
//             }
//         }
//     },

//     //CUSTOM SEARCH
//     handleCustomSearch: function (oEvent) {
//         let oModel = this.getOwnerComponent().getModel('SearchMaterialByChar')
//         let oCustomSearchDialog = this.getView().byId("idCustomSearch");
//         if (!oCustomSearchDialog) {
//             oCustomSearchDialog = sap.ui.xmlfragment(this.getView().getId(), "zmaterialcreate.materialcreate.ext.fragment.CustomSearchByCharClass", this);
//             this.getView().addDependent(oCustomSearchDialog);
//         }
//         oCustomSearchDialog.setModel(oModel)
//         oCustomSearchDialog.setEscapeHandler(this.onPressEscapeButton.bind(this));
//         oCustomSearchDialog.open();
//     },

//     onAddTableRow: function () {
//         let oModel = this.getOwnerComponent().getModel("SearchMaterialByChar");
//         var oTable = this.getView().byId("idTable");
//         debugger;
//         var oNewColumnListItem = new sap.m.ColumnListItem({
//             cells: [
//                 new sap.ui.comp.smartfield.SmartField({
//                     entitySet: "ZC_QU_DG_MatClassUnion",
//                     value: "{class}",
//                 }),
//                 new sap.ui.comp.smartfield.SmartField({
//                     entitySet: "ZC_QU_DG_MatClassUnion",
//                     value: "{atnam}",
//                 }),
//                 new sap.ui.comp.smartfield.SmartField({
//                     entitySet: "ZC_QU_DG_MatClassUnion",
//                     value: "{atwrtValue}",

//                 }),
//                 new sap.m.Button({
//                     type: "Transparent",
//                     icon: "sap-icon://decline",
//                     press: this.onRemoveTableRow.bind(this)
//                 })
//             ]
//         }).setBindingContext(oModel.createEntry("/ZC_QU_DG_MatClassUnion", {}));
//         //let oModel = this.getOwnerComponent().getModel("SearchMaterialByChar");
//         //let oContext = oModel.createEntry("/ZC_QU_DG_MatClassUnion", {});
//         // oNewItem.getCells().forEach((cell)=>{
//         //     cell.setBindingContext(oContext)
//         // })
//         //oNewColumnListItem.setBindingContext(oContext);
//         oTable.addItem(oNewColumnListItem);
//     },

//     onRemoveTableRow: function (oEvent) {
//         let oButton = oEvent.getSource();
//         let oItem = oButton.getParent();
//         let oTable = this.getView().byId("idTable");
//         oTable.removeItem(oItem);
//     },

//     onDialogSearch: function (oEvent) {
//         let oCustomSearchDialog = this.getView().byId("idCustomSearch")
//         let oModel = this.getOwnerComponent().getModel('SearchMaterialByChar')
//         let aCharacteristics = this._GetCharTableData()
//         //let sCharClassName = this.getView().byId("idSearchField").getValue()

//         //PREPARING ODATA Read Parameters//
//         let oReadParameters = {
//             success: function (oData, oRes) {
//                 oCustomSearchDialog.setBusy(false)
//                 oCustomSearchDialog.close()
//                 let aMaterials = []
//                 let aRequests = []
//                 oData.results.forEach((item) => {
//                     if (item.matnr.length > 0) {
//                         aMaterials.push(item.matnr);
//                     }
//                     if (item.reqid.length > 0) {
//                         aRequests.push(item.reqid);
//                     }
//                 })
//                 let oCustomSearchResults = {
//                     Materials: [...new Set(aMaterials)],
//                     Requests: [...new Set(aRequests)]
//                 }
//                 debugger;
//                 this._PassCustomFilters(oCustomSearchResults)

//             }.bind(this),
//             error: function (oErr) { console.warn(oErr); debugger },
//         }

//         //ADDING FILTER PARAMETER IF FILTERS ARE PRESENT
//         if (aCharacteristics.length > 0) {
//             let aFilters = []
//             aCharacteristics.forEach((item) => {
//                 let oFilter = new sap.ui.model.Filter({
//                     filters: [
//                         new sap.ui.model.Filter("class", "EQ", item.ClassName),
//                         new sap.ui.model.Filter("atnam", "EQ", item.CharacteristicsName),
//                         new sap.ui.model.Filter("atwrtValue", "Contains", item.CharacteristicsValue)
//                     ],
//                     and: true
//                 })
//                 aFilters.push(oFilter)
//             })
//             let oCombinedFilter = new sap.ui.model.Filter({
//                 filters: aFilters,
//                 and: false
//             });
//             oReadParameters.filters = [oCombinedFilter]
//         }

//         //ADDING URL PARAMETERS IF SEARCH PARAMETER IS PRESENT
//         // if (sCharClassName && sCharClassName.length > 0) {
//         //     oReadParameters.urlParameters = {
//         //         search: sCharClassName
//         //     }
//         // }

//         //MAKING GET CALL
//         if (aCharacteristics.length > 0) {
//             oCustomSearchDialog.setBusy(true)
//             oModel.read('/ZC_QU_DG_MatClassUnion', oReadParameters)
//         } else {
//             debugger;
//             let oSmartFilterBar = this.getView().byId('listReportFilter')
//             oCustomSearchDialog.close()
//             let oSearchData = {
//                 matnr: {
//                     items: [],
//                 },
//                 reqid: {
//                     items: [],
//                 },
//             }

//             this.Materials = null;
//             this.Requests = null;
//             oSmartFilterBar.setFilterData(oSearchData)
//             oSmartFilterBar.search()

//         }
//     },

//     _GetCharTableData: function (oEvent) {
//         let oTable = this.getView().byId("idTable");
//         let aItems = oTable.getItems();
//         let aResults = [];
//         aItems.forEach(function (oItem) {
//             // Get the cells in the current row
//             let aCells = oItem.getCells();
//             let oRowData = {}
//             // Loop through each cell and get the value from SmartField

//             aCells.forEach(function (oCell, index) {
//                 if (oCell instanceof sap.ui.comp.smartfield.SmartField) {
//                     let sValue = oCell.getValue();
//                     if (sValue && sValue.length > 0) {
//                         if (index === 0) {
//                             oRowData.ClassName = sValue;
//                         } else if (index === 1) {
//                             oRowData.CharacteristicsName = sValue;
//                         } else if (index === 2) {
//                             oRowData.CharacteristicsValue = sValue;
//                         }
//                     }
//                 }
//             });
//             // Add the row data to the results array
//             if (Object.keys(oRowData).length > 0) {
//                 aResults.push(oRowData)
//             }
//         });
//         return aResults
//     },

//     _PassCustomFilters: function (data) {
//         this.Materials = data.Materials
//         this.Requests = data.Requests
//         let sMaterialsTable = this.getView().byId("listReport-tab0");
//         let sRequestsTable = this.getView().byId("listReport-tab1");
//         debugger;
//         sMaterialsTable.rebindTable()
//         sRequestsTable.rebindTable()
//     },

//     onCloseCustomSearchDialog: function (oEvent) {
//         let oCustomSearchDialog = this.getView().byId("idCustomSearch")
//         oCustomSearchDialog.close();
//     },
// });