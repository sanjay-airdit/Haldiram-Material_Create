sap.ui.define([
    "sap/m/MessageToast",
    'sap/ui/model/json/JSONModel',
    "zmaterialcreate/materialcreate/ext/utils/formatter",
    "sap/ui/core/routing/History",
    "zmaterialcreate/materialcreate/ext/controller/Attachments",
], function (MessageToast, JSONModel, formatter, History, Attachments) {
    'use strict';

    return {
        customFormatter: formatter,
        onInit: function () {
            this.extensionAPI.attachPageDataLoaded(this._onPageDataLoad.bind(this))

            //ATTACH CHANGE EVENT TO FIELDS
            this._attachChangeEventToFields();

        },
        _onPageDataLoad: function (oEvent) {
            let sObjectPage = this.getView().getBindingContext().getPath().match(/^\/([^(\s]+)/)?.[1]
            if (sObjectPage === "ZP_QU_DG_MARA_MASSREQ") {
                let oStartUpParamsModel = this.getOwnerComponent().getModel('StartUpParamsModel');
                if (oStartUpParamsModel && oStartUpParamsModel.getData().params) {
                    const oStartUpParamsModelData = oStartUpParamsModel.getData();
                    this._bIsNavigatingFromExternal = oStartUpParamsModelData?.isNavigatingFromExternal ?? false;
                    this._WorkItemId = oStartUpParamsModelData.params.WIID;
                } else {
                    this._bIsNavigatingFromExternal = false;
                }

                //GETTING THE WORK ITEM DETAILS
                let sReqid = this.getView().getBindingContext().getProperty('Reqid')
                let oMyTaskModel = this.getOwnerComponent().getModel("MyTask")

                oMyTaskModel.read("/ZP_QU_DG_WORKITEMWITHREQUESTS", {
                    urlParameters: {
                        "$skip": 0,
                        "$top": 1,
                    },
                    filters: [new sap.ui.model.Filter("Technical_WorkFlow_Object", "EQ", sReqid)],
                    success: function (oData) {
                        const oItem = oData.results?.[0] || {};
                        this._WorkItemId = oItem.WorkItem_ID;
                        this._TopLevelWiid = oItem.TopLevelWorkflowTask;
                        this._Sequence = oItem.sequence;
                        this._ProcessId = oItem.process_id;
                        this._GetComments(this._TopLevelWiid);
                        this._ManageBottons();
                        this._getattachment();

                    }.bind(this),
                    error: function (oErr) {
                        console.error("Read failed for", sPath, oErr);
                    }.bind(this)
                });

                // if (this._bIsNavigatingFromExternal) {
                //     // NAVIGATING FROM MYTASK or Notification or Dashboard page
                //     let oParams = oStartUpParamsModelData.params
                //     this.showApproverBtns = true;
                //     // this._TopLevelWiid = oParams.TOP_WIID;
                //     // this._WorkItemId = oParams.WIID;
                //     // this._Sequence = oParams.SEQUENCE;
                //     // this._ProcessId = oParams.PROCESS_ID;
                //     // this._GetComments(this._TopLevelWiid);
                //     // this._getattachment()
                //     // this._ManageBottons()

                // } else {
                //     debugger
                //     //NAVIGATING FROM LIST REPORT

                //     // let sReqid = this.getView().getBindingContext().getProperty('Reqid')
                //     // let oMyTaskModel = this.getOwnerComponent().getModel("MyTask")

                //     // oMyTaskModel.read("/ZP_QU_DG_WORKITEMWITHREQUESTS", {
                //     //     urlParameters: {
                //     //         "$skip": 0,
                //     //         "$top": 1,
                //     //     },
                //     //     filters: [new sap.ui.model.Filter("Technical_WorkFlow_Object", "EQ", sReqid)],
                //     //     success: function (oData) {
                //     //         debugger;
                //     //         this.getView().setBusy(false)
                //     //         const oItem = oData.results?.[0] || {};

                //     //         this._WorkItemId = oItem.WorkItem_ID;
                //     //         this._TopLevelWiid = oItem.TopLevelWorkflowTask;
                //     //         this._Sequence = oItem.sequence;
                //     //         this._ProcessId = oItem.process_id;
                //     //         this._GetComments(this._TopLevelWiid);
                //     //         this._ManageBottons();
                //     //         this._getattachment();

                //     //     }.bind(this),
                //     //     error: function (oErr) {
                //     //         this.getView().setBusy(false)
                //     //         console.error("Read failed for", sPath, oErr);
                //     //     }.bind(this)
                //     // });


                // }
            }

            //REBIND THE TABLES
            this.reqType = this.getView().getBindingContext().getProperty("reqtyp")
            const facet = this.byId(`${this.getView().getId()}--template:::ObjectPageSection:::AfterFacetExtensionSectionWithKey:::sFacet::S:::sEntitySet::ZP_QU_DG_MARA_MASSREQ:::sFacetExtensionKey::2`);
            debugger;
            if (facet && this.reqType === "EX") {
                facet.setVisible(false);
            } else if (!facet) {
                console.warn("Facet not found: AfterFacet|ZP_QU_DG_MARA_MASSREQ|S|2");
            }
            this.rebindTables()

            //AFTER CLICK ON APPLY IN THE CLASSIFICATION OBJECT PAGE REFRESH THE MODEL SO THAT LONG TEXT FIELD WILL GET UPDATED
            this.getView().getModel().refresh()


            this._onBatchRequestCompletedHandler = this._attachBatchRequestsCompleted.bind(this);
            //ATTACHING SUBMIT BUTTON EVENT
            let oDraftController = this.extensionAPI.getTransactionController()
            oDraftController.attachAfterActivate(function (oEvent) {
                this._Submit = true;
                this.getView().getModel().attachBatchRequestCompleted(this._onBatchRequestCompletedHandler)
            }.bind(this))

        },
        onAfterRendering: function (oEvent) {
            // this.byId('zmaterialcreate.materialcreate::sap.suite.ui.generic.template.ObjectPage.view.Details::ZP_QU_DG_MARA_MASSREQ--attachmentReuseComponent::simple::Attachments::ComponentContainerContent---attachmentService--attachmentTitle').setText('Attachments')

        },
        // onNavigateToMyTask: function (data) {
        //     let oApi = this.extensionAPI;
        //     let oNavigationController = oApi.getNavigationController();
        //     oNavigationController.navigateInternal('', { routeName: "CustomRoute" });
        // },
        // onCancelBtnPress: function () {
        //     window.history.go(-1)
        //     // this._bIsNavigatingFromExternal ? sap.ui.getCore().navigateExternal('mytasknew.mytasknew', '', {  }) : window.history.go(-1)
        // },


        _attachChangeEventToFields: function () {
            var oObjectPage = this.getView() // Get the ObjectPage control
            var aControls = oObjectPage.findAggregatedObjects(true); // Get all controls in the Object Page

            aControls.forEach(function (oControl) {
                // Only attach the 'change' event to input-like controls
                if (oControl.attachChange) {
                    oControl.attachChange(this._onFieldChange, this);
                }
            }, this);
        },

        _attachBatchRequestsCompleted: function (oEvent) {
            let aRequests = oEvent.getParameter('requests')
            console.log(aRequests.length)
            let bIsActivated = this.getView().getBindingContext().getObject().IsActiveEntity
            this._Submit = bIsActivated
            this.getView().getModel().detachBatchRequestCompleted(this._onBatchRequestCompletedHandler)
        },

        _onFieldChange: function (oEvent) {
            const oSource = oEvent.getSource();
            const oModel = this.getView().getModel();
            if (oSource instanceof sap.ui.comp.smartfield.SmartField) {
                // let oIsCheckbox = oSource.getDataProperty()?.property?.name;
                // setTimeout(() => {
                //     const status = this.getView().getBindingContext().getProperty("dupindicator");

                //     if (status) {
                //         this.getView().getBindingContext().setProperty("Lvorm_fc", 3);
                //     } else {
                //         this.getView().getBindingContext().setProperty("Lvorm_fc", 2);
                //     }
                // }, 1000);

                const status = this.getView().getBindingContext().getProperty("dupindicator");

                if (status) {
                    this.getView().getBindingContext().setProperty("Lvorm_fc", 3);
                } else {
                    this.getView().getBindingContext().setProperty("Lvorm_fc", 2);
                }

                this.getView().getModel().refresh()
                this.rebindTables();


                // Create debounce function only once
                if (!this._submitChangesDebounceTimer) {
                    this._submitChangesDebounceTimer = null;
                }

                // Clear previous timer if any
                clearTimeout(this._submitChangesDebounceTimer);

                // Set a new timer to debounce
                // this._submitChangesDebounceTimer = setTimeout(() => {
                //     if (oModel.hasPendingChanges() && !this._Submit) {
                //         this._submitChangesManually();
                //     }
                // }, 500); // 500ms debounce window

            }
        },

        // Submit the changes using submitChanges
        _submitChangesManually: function () {
            debugger
            var oModel = this.getView().getModel(); // Assuming you have an ODataModel set
            var oContext = this.getView().getBindingContext(); // Get the context of the currently bound entity
            var sReqid = oContext.getObject().Reqid;
            var sSNo = oContext.getObject().SNo;
            var sMatnr = oContext.getObject().Matnr;


            oModel.submitChanges({
                success: function (oData) {
                    console.log("Changes submitted successfully", oData);
                    // You can refresh your model or handle success here
                    let oPayload = {
                        SideEffectsQualifier: 0,
                        SNo: sSNo,
                        Reqid: sReqid,
                        Matnr: sMatnr,
                        IsActiveEntity: false
                    }
                    oModel.callFunction('/ZP_QU_DG_MARA_MASSREQPrepare', {
                        method: "POST",
                        urlParameters: oPayload,
                        success: function (oData, oRes) {
                            debugger
                        },
                        error: function (oErr) {
                            debugger
                        }
                    })
                }.bind(this),
                error: function (oError) {
                    console.error("Failed to submit changes", oError);
                    // Handle error if necessary
                }
            });



        },

        _ManageBottons: function () {
            //BASED ON WORKITEM ID
            if (!this._bIsNavigatingFromExternal) {
                this.getView().byId(this.getView().getId() + '--Approve').setVisible(false)
                this.getView().byId(this.getView().getId() + '--Reject').setVisible(false)
                this.getView().byId(this.getView().getId() + '--Submit').setVisible(false)
            }

            //BASED ON VIEW MODE
            let oViewData = this.getView().getModel('ui').getData()
            this.getView().getContent()[0].setShowHeaderContent(true)
            this.byId('BasicTxt-1').setEditable(oViewData.editable)
            this.byId('BasicTxt-2').setEditable(oViewData.editable)
            this.byId("fileUploader").setVisible(oViewData.editable)
            this.byId("deleteButton").setVisible(oViewData.editable)

            //CANCEL BUTTON
            // this.byId('cancel').setVisible(this._bIsNavigatingFromExternal)

        },

        rebindTables: function () {
            const aSmartTableIds = [
                "MaterialUOM::Table",
                "MaterialSales::Table",
                "MaterialPlants::Table",
                "MaterialWH::Table",
                "MaterialVal::Table"
            ];

            aSmartTableIds.forEach(sTableId => {
                const oSmartTable = this.byId(sTableId);
                if (oSmartTable) {
                    oSmartTable.rebindTable(true); // this will trigger onBeforeRebindTableExtension
                }
            });
        },

        _makeSmartTableColumnsReadOnly: function () {
            const aSmartTableIds = [
                "MaterialUOM::Table",
                "MaterialSales::Table",
                "MaterialPlants::Table",
                "MaterialWH::Table",
                "MaterialVal::Table"
            ];

            aSmartTableIds.forEach(sTableId => {
                const oSmartTable = this.byId(sTableId);
                if (!oSmartTable) return;

                const oInnerTable = oSmartTable.getTable(); // Get internal sap.m.Table or sap.ui.table.Table
                if (!oInnerTable || !oInnerTable.getItems) return;

                oInnerTable.getItems().forEach(oItem => {
                    const aCells = oItem.getCells();
                    aCells.forEach(oCell => {
                        const sPath = this._getBoundPath(oCell);
                        if (sPath && sPath.endsWith("Lvorm") && oCell.setEditable) {
                            oCell.setEditable(false);
                        }
                    });
                });
            });
        },

        _getBoundPath: function (oControl) {
            const oBinding = oControl.getBinding("value") || oControl.getBinding("text");
            return oBinding ? oBinding.getPath() : null;
        },

        onDuplicateCheck: function (oEvent) {
            this.getView().setBusy(true);

            const oModel = this.getView().getModel();
            let oData = this.getView().getBindingContext().getObject()
            this.getView().setModel(new sap.ui.model.json.JSONModel([oData]), "currentRecord")
            debugger;
            var mParameters = {
                SNo: oData.SNo,
                Reqid: oData.Reqid,
                Matnr: oData.Matnr,
                IsActiveEntity: oData.IsActiveEntity
            };

            oModel.callFunction("/CheckDuplicate", {
                method: "POST",
                urlParameters: mParameters,
                success: function (oData, response) {
                    this.getView().setBusy(false)
                    if (oData.results.length === 0) {
                        MessageToast.show("No Duplicates Available");
                        return;
                    }
                    const duplicateModel = new sap.ui.model.json.JSONModel(oData.results);
                    this.getView().setModel(duplicateModel, "duplicateModel");
                    if (!this.duplicateFragment) {
                        this.duplicateFragment = sap.ui.xmlfragment("zmaterialcreate.materialcreate.ext.fragment.DuplicateCheck", this);
                        this.getView().addDependent(this.duplicateFragment);
                    }
                    this.duplicateFragment.open();
                }.bind(this),
                error: function (oError) {
                    this.getView().setBusy(false)
                    MessageToast.show("Error calling function import", oError);
                }.bind(this),
            });
        },

        onFieldChange: function () {
            debugger;
        },

        onCloseDuplicateCheck: function () {
            this.duplicateFragment.close();
        },
        onIgnoreDuplicates: function () {
            let sPath = this.getView().getBindingContext().getPath();
            let oModelData = this.getView().getModel();
            if (oModelData.getProperty(sPath + "/dupindicator") === false) {
                oModelData.setProperty(sPath + "/dupindicator", true);
                sap.m.MessageToast.show("Potential duplicates Ignored");
            }
            else {
                oModelData.setProperty(sPath + "/dupindicator", false);
                sap.m.MessageToast.show("Potential duplicates will be checked");
            }
            this.duplicateFragment.close();
        },

        onBeforeRebindTableExtension: function (oEvent) {
            let oViewData = this.getView().getModel('ui').getData();
            let sDeleteUoM = this.getView().createId("MaterialUOM::deleteEntry");
            let sDeleteTax = this.getView().createId("MaterialTaxData::deleteEntry");

            let sUnitOfMeasureTable = this.getView().createId("MaterialUOM::Table");
            let sSalesTable = this.getView().createId("MaterialSales::Table")
            let sPlantsTable = this.getView().createId("MaterialPlants::Table");
            let sWareHouseTable = this.getView().createId("MaterialWH::Table");
            let sAccountingTable = this.getView().createId("MaterialVal::Table");

            // const oUoMTable = this.byId(sUnitOfMeasureTable);
            // const oSalesTable = this.byId(sSalesTable);
            // const oPlantsTable = this.byId("MaterialPlants::responsiveTable-listUl");
            // const oWareTable = this.byId("MaterialUOM::responsiveTable-listUl");
            // const oAccountTable = this.byId("MaterialVal::responsiveTable-listUl");

            if (this.reqType !== "DELETE") {
                switch (oEvent.getSource().getId()) {
                    case sUnitOfMeasureTable:
                        this.byId(sUnitOfMeasureTable).deactivateColumns(["Lvorm"])
                        break;
                    case sSalesTable:
                        this.byId(sSalesTable).deactivateColumns(["Lvorm"])
                        break;
                    case sPlantsTable:
                        this.byId(sPlantsTable).deactivateColumns(["Lvorm"])
                        break;
                    case sWareHouseTable:
                        this.byId(sWareHouseTable).deactivateColumns(["Lvorm"])
                        break;
                    case sAccountingTable:
                        this.byId(sAccountingTable).deactivateColumns(["Lvorm"])
                        break;
                    default:
                        break;
                }
            } else {
                // If reqType is DELETE, reactivate the columns
                switch (oEvent.getSource().getId()) {
                    case sUnitOfMeasureTable:
                        this.byId(sUnitOfMeasureTable).deactivateColumns([])
                        break;
                    case sSalesTable:
                        this.byId(sSalesTable).deactivateColumns([])
                        break;
                    case sPlantsTable:
                        this.byId(sPlantsTable).deactivateColumns([])
                        break;
                    case sWareHouseTable:
                        this.byId(sWareHouseTable).deactivateColumns([])
                        break;
                    case sAccountingTable:
                        this.byId(sAccountingTable).deactivateColumns([])
                        break;
                    default:
                        break;
                }
            }

            // oUoMTable.getMetadata().getName()
            // oUoMTable.getTable().getColumns().forEach(oCol => {
            //     const oHeader = oCol.getHeader
            //         ? oCol.getHeader()
            //         : oCol.getAggregation("header");
            //     const sLabel = oHeader && oHeader.getText && oHeader.getText();
            //     console.log("Column label:", sLabel);
            // });

            // if (sap.ui.getCore().byId(sDeleteUoM) !== undefined) {
            //     sap.ui.getCore().byId(sDeleteUoM).setVisible(false);
            // }
            if (sap.ui.getCore().byId(sDeleteTax) !== undefined) {
                sap.ui.getCore().byId(sDeleteTax).setVisible(false);
            }

            //AUTO ADJUST COLUMN LENGTH B BASED ON LABEL
            const oBindingParams = oEvent.getParameter("bindingParams");
            let oTable = oEvent.getSource().getTable(); // get internal table
            let aColumns = oTable.getColumns();
            oBindingParams.events = {
                dataReceived: function (oDataReceivedEvent) {
                    aColumns.forEach(function (oColumn) {
                        let sLabelText = oColumn.getAggregation('header').getText();
                        // Estimate width in 'em' based on label length
                        let labelLength = sLabelText.length;
                        let estimatedWidth = Math.max(5, Math.min(20, labelLength * 0.75)); // limit between 5em and 20em
                        oColumn.setWidth(estimatedWidth + "em");
                    });
                }
            };




        },

        // *****************______________Show log timeline_______________***********************

        onShowLog: function (oEvent) {
            this.getView().setBusy(true);
            this._PrepareLog(oEvent)
        },
        onCloseLog: function () {
            let _oDialogLog = this.getView().byId("idLogs");
            _oDialogLog.close();
            _oDialogLog.destroy();
            _oDialogLog === null;
        },
        _PrepareLog: function (oEvent) {
            let oWorkflowModel = this.getOwnerComponent().getModel("WorkFlowModel");
            let _oDialogLog = this.getView().byId("idLogs");
            if (!_oDialogLog) {
                _oDialogLog = new sap.ui.xmlfragment(this.getView().getId(), "zmaterialcreate.materialcreate.ext.fragment.Logs", this);
                this.getView().addDependent(_oDialogLog);
            }
            let sWorkItemId = this._WorkItemId
            let sReqid = this.getView().getBindingContext().getProperty('Reqid')
            oWorkflowModel.read('/WorkflowLogSet', {
                // Code added by mahesh--------------->

                filters: [
                    new sap.ui.model.Filter('WfId', "EQ", sWorkItemId),
                    new sap.ui.model.Filter('Reqid', "EQ", sReqid)],
                success: function (oData, oRes) {
                    let aFilteredData = oData.results.filter((item) => {
                        return item.WiStat !== "PENDING"
                    })
                    this._LogForTimeline(aFilteredData)
                    this.getView().setBusy(false)
                    _oDialogLog.open()
                }.bind(this),
                error: function (oErr) {
                    this.getView().setBusy(false)
                }.bind(this),
            })

        },
        _LogForTimeline: function (aData) {
            var logModel = new sap.ui.model.json.JSONModel();
            logModel.setData({ "LogCollection": aData });
            this.getView().byId("logList").setModel(logModel, "logModel");
        },

        // ****************_______________Show Status Graph________________***************

        onShowStatus: function (oEvent) {
            this.getView().setBusy(true);
            this._PrepareStatusLog(oEvent)
        },
        onCloseStatusLog: function () {
            let _oDialogStatusLog = this.getView().byId("idStatusLogs")
            _oDialogStatusLog.close();
            _oDialogStatusLog.destroy();
            _oDialogStatusLog === null;
        },
        _PrepareStatusLog: function (oEvent) {
            let oWorkflowModel = this.getOwnerComponent().getModel("WorkFlowModel");

            let sWorkItemId = this._WorkItemId;
            let sReqid = this.getView().getBindingContext().getProperty('Reqid')

            //LOG FOR STATUS --- NETWORK GRAPH
            let _oDialogStatusLog = this.getView().byId("idStatusLogs");
            if (!_oDialogStatusLog) {
                _oDialogStatusLog = new sap.ui.xmlfragment(this.getView().getId(), "zmaterialcreate.materialcreate.ext.fragment.StatusLog", this);
                this.getView().addDependent(_oDialogStatusLog);
            }
            debugger

            oWorkflowModel.read('/WorkflowLogSet', {
                filters: [
                    new sap.ui.model.Filter('WfId', "EQ", sWorkItemId),
                    new sap.ui.model.Filter('Reqid', "EQ", sReqid),],
                success: function (oData, oRes) {
                    this._LogForGraph(oData.results)
                    this.getView().setBusy(false)
                    _oDialogStatusLog.open()
                }.bind(this),
                error: function (oErr) {
                    this.getView().setBusy(false)
                }.bind(this),
            })
        },
        _LogForGraph: function (aData) {
            let aLogData = aData
            const seenSequences = new Set();
            const aFilteredData = [];

            for (let i = aLogData.length - 1; i >= 0; i--) {
                if (!seenSequences.has(aLogData[i].Sequence)) {
                    seenSequences.add(aLogData[i].Sequence);
                    aFilteredData.push(aLogData[i]);
                }
            }

            //aFilteredData.reverse(); // Restore original order
            debugger;
            let aNodes = aFilteredData
            let aLines = []
            aFilteredData.forEach(item => {
                const { Sequence, Preceeding_seq } = item;
                if (Sequence === 'START') {
                    aLines.push({ from: 'START', to: '1-1', lineType: 'Dotted' });
                }
                const predecessors = Preceeding_seq.split('&');
                predecessors.forEach(predecessor => {
                    if (predecessor !== "0-0" && predecessor !== "") {
                        aLines.push({ from: predecessor, to: Sequence });
                    }
                });
            });

            //IF IT IS REJECTED, THEN ALL OTHER NODES STATUS SHOULD CHANGE TO PENDING
            // aNodes.forEach(item => {
            //     if (aNodes.some(obj => obj.Sequence === "1-1" && obj.WiStat === "READY")) {
            //         if (item.Sequence !== "1-1" && item.Sequence !== "START") {
            //             item.WiStat = "PENDING";
            //         }
            //     }
            // });

            function markPending(seq) {
                aNodes.forEach(item => {
                    if (
                        item.Sequence !== "START" &&
                        item.Preceeding_seq &&
                        item.Preceeding_seq.split("&").includes(seq)
                    ) {
                        if (item.WiStat !== "READY") {
                            item.WiStat = "PENDING";
                            markPending(item.Sequence); // recurse further
                        }
                    }
                });
            }

            // If node is READY, mark successors as PENDING
            aNodes.forEach(item => {
                if (item.Sequence !== "START" && item.WiStat === "READY") {
                    markPending(item.Sequence);
                }
            });


            //MAKE DATE AS NULL IF THE STATUS IS READY
            aNodes.forEach(item => {
                if (item.WiStat === 'READY') {
                    item.WiAed = null;
                    item.WiCt = null;
                }
            });
            const oGraphData = {
                nodes: aNodes,
                lines: aLines
            };
            debugger;
            var oNetworkModel = new sap.ui.model.json.JSONModel(oGraphData);
            this.byId('networkGraph').setModel(oNetworkModel, 'StatusLogModel')

        },
        onAfterLayouting: function (oEvent) {
            let aNodes = oEvent.getSource().getNodes()
            aNodes.forEach((node) => {
                if (node.getStatus() === 'Standard') {
                    debugger;
                    node.addStyleClass('myDisabledNode')
                }
            })

        },

        // ****************_______________WITHDRAW________________***************
        onWithdraw: function () {
            let that = this;
            sap.m.MessageBox.confirm("Are you sure you want to Withdraw the request?", {
                icon: sap.m.MessageBox.Icon.WARNING,
                title: "",
                onClose: function (oAction) {
                    if (oAction === sap.m.MessageBox.Action.OK) {
                        that.getView().setBusy(true);
                        let oApi = that.extensionAPI;
                        let WiId = that._WorkItemId


                        let oData = that.getView().getBindingContext().getObject()
                        let oPayload = {
                            SNo: oData.SNo,
                            Reqid: oData.Reqid,
                            Matnr: oData.Matnr,
                            IsActiveEntity: oData.IsActiveEntity,
                            WiId: WiId,
                            Step: "1"
                        }

                        let oPromise = oApi.invokeActions("/withdraw", [], oPayload);
                        oPromise
                            .then(function (aResponse) {
                                that.getView().setBusy(false);
                                //that.getOwnerComponent().getRouter().navTo('root', true)
                                window.history.go(-1);
                            })
                            .catch(function (oErr) {
                                that.getView().setBusy(false);
                                sap.m.MessageToast.show('Something went wrong...!!!')
                                console.error(oErr)
                            });

                    }
                }
            });
        },

        // ****************_______________UPDATE________________***************
        onUpdate: async function () {
            // oExtensionApi = this.extensionAPI();
            debugger
            this.getView().setBusy(true);
            let oApi = this.extensionAPI;
            let matnr = this.getView().getBindingContext().getProperty('Matnr');
            let sSno = this.getView().getBindingContext().getProperty('SNo');
            let sReqid = this.getView().getBindingContext().getProperty('Reqid');
            let sMtart = this.getView().getBindingContext().getProperty('Mtart');
            let sReqtyp = "UPDATE";
            let IsActiveEntity = this.getView().getBindingContext().getProperty('IsActiveEntity');
            var aCheckResponse = await oApi.invokeActions("/check_screen_and_workflow", [], { SNo: sSno, Reqid: sReqid, Matnr: matnr, Mtart: sMtart, reqtyp: sReqtyp, IsActiveEntity: IsActiveEntity });
            let sSeverity = JSON.parse(aCheckResponse[0].response.response.headers["sap-message"]).severity;
            if (sSeverity === "success") {
                const oModel = this.getView().getModel();

                var mParameters = {
                    Matnr: matnr,
                    IsCopy: false,
                    IsDelete: false,
                }

                oModel.callFunction("/create_update_request", {
                    method: "POST",
                    urlParameters: mParameters,
                    success: function (oData, response) {
                        this.getView().setBusy(false);

                        const sSapMsgHeader = response.headers['sap-message'];
                        if (response.statusCode === "200" && sSapMsgHeader) {
                            try {
                                const oSapMsgObj = JSON.parse(sSapMsgHeader);
                                const oSapMsg = oSapMsgObj.message;
                                const oSapSeverity = oSapMsgObj.severity;

                                if (oSapMsg && oSapSeverity === "info") {
                                    sap.m.MessageBox.show(oSapMsg, {
                                        icon: sap.m.MessageBox.Icon.WARNING,
                                        title: "Information",
                                    });
                                }
                            } catch (e) {
                                console.error("Failed to parse sap-message header", e);
                            }
                        }

                        try {
                            let oModelContext = this.getOwnerComponent().getModel();
                            let url = response.headers.location;
                            let sPathMatch = url.match(/\/ZP_QU_DG_MARA_MASSREQ\([^\)]+\)/);

                            if (sPathMatch && sPathMatch[0]) {
                                let oContextToNavigate = new sap.ui.model.Context(oModelContext, sPathMatch[0]);
                                let oNavController = this.extensionAPI.getNavigationController();
                                oNavController.navigateInternal(oContextToNavigate);
                            } else {
                                console.warn("Navigation path not found in location header:", url);
                            }
                        } catch (e) {
                            console.error("Navigation error:", e);
                        }
                    }.bind(this),

                    error: function (oError) {
                        this.getView().setBusy(false);
                        MessageToast.show("Error calling function import");
                        console.error("Function import error:", oError);
                    }.bind(this),
                });
            } else {
                let sErrorMessage = JSON.parse(aCheckResponse[0].response.response.headers["sap-message"]).message;
                // sap.m.MessageBox.error(sErrorMessage);
                this.getView().setBusy(false);
                // return;
            }
            // const oModel = this.getView().getModel();

            // var mParameters = {
            //     Matnr: matnr,
            //     IsCopy: false,
            //     IsDelete: false,
            // }

            // oModel.callFunction("/create_update_request", {
            //     method: "POST",
            //     urlParameters: mParameters,
            //     success: function (oData, response) {
            //         this.getView().setBusy(false);

            //         const sSapMsgHeader = response.headers['sap-message'];
            //         if (response.statusCode === "200" && sSapMsgHeader) {
            //             try {
            //                 const oSapMsgObj = JSON.parse(sSapMsgHeader);
            //                 const oSapMsg = oSapMsgObj.message;
            //                 const oSapSeverity = oSapMsgObj.severity;

            //                 if (oSapMsg && oSapSeverity === "info") {
            //                     sap.m.MessageBox.show(oSapMsg, {
            //                         icon: sap.m.MessageBox.Icon.WARNING,
            //                         title: "Information",
            //                     });
            //                 }
            //             } catch (e) {
            //                 console.error("Failed to parse sap-message header", e);
            //             }
            //         }

            //         try {
            //             let oModelContext = this.getOwnerComponent().getModel();
            //             let url = response.headers.location;
            //             let sPathMatch = url.match(/\/ZP_QU_DG_MARA_MASSREQ\([^\)]+\)/);

            //             if (sPathMatch && sPathMatch[0]) {
            //                 let oContextToNavigate = new sap.ui.model.Context(oModelContext, sPathMatch[0]);
            //                 let oNavController = this.extensionAPI.getNavigationController();
            //                 oNavController.navigateInternal(oContextToNavigate);
            //             } else {
            //                 console.warn("Navigation path not found in location header:", url);
            //             }
            //         } catch (e) {
            //             console.error("Navigation error:", e);
            //         }
            //     }.bind(this),

            //     error: function (oError) {
            //         this.getView().setBusy(false);
            //         MessageToast.show("Error calling function import");
            //         console.error("Function import error:", oError);
            //     }.bind(this),
            // });

        },

        // ****************_______________DELETE________________***************
        onDelete: function () {
            // oExtensionApi = this.extensionAPI();
            debugger
            this.getView().setBusy(true)
            let matnr = this.getView().getBindingContext().getProperty('Matnr');
            const oModel = this.getView().getModel();

            var mParameters = {
                Matnr: matnr,
                IsCopy: false,
                IsDelete: true,
            }


            oModel.callFunction("/create_update_request", {
                method: "POST",
                urlParameters: mParameters,
                success: function (oData, response) {
                    this.getView().setBusy(false);

                    const sSapMsgHeader = response.headers['sap-message'];
                    if (response.statusCode === "200" && sSapMsgHeader) {
                        try {
                            const oSapMsgObj = JSON.parse(sSapMsgHeader);
                            const oSapMsg = oSapMsgObj.message;
                            const oSapSeverity = oSapMsgObj.severity;

                            if (oSapMsg && oSapSeverity === "info") {
                                sap.m.MessageBox.show(oSapMsg, {
                                    icon: sap.m.MessageBox.Icon.WARNING,
                                    title: "Information",
                                });
                            }
                        } catch (e) {
                            console.error("Failed to parse sap-message header", e);
                        }
                    }

                    try {
                        let oModelContext = this.getOwnerComponent().getModel();
                        let url = response.headers.location;
                        let sPathMatch = url.match(/\/ZP_QU_DG_MARA_MASSREQ\([^\)]+\)/);

                        if (sPathMatch && sPathMatch[0]) {
                            let oContextToNavigate = new sap.ui.model.Context(oModelContext, sPathMatch[0]);
                            let oNavController = this.extensionAPI.getNavigationController();
                            oNavController.navigateInternal(oContextToNavigate);
                        } else {
                            console.warn("Navigation path not found in location header:", url);
                        }
                    } catch (e) {
                        console.error("Navigation error:", e);
                    }
                }.bind(this),

                error: function (oError) {
                    this.getView().setBusy(false);
                    MessageToast.show("Error calling function import");
                    console.error("Function import error:", oError);
                }.bind(this),
            });

        },

        //******************_________CUSTOM VALUE HELP FOR CHAR VALUES__________*********
        onClickCharValueVH: function (oEvent) {
            this.getView().setBusy(true)
            let sKlart = this.getView().getBindingContext().getObject().klart;
            let sClass = this.getView().getBindingContext().getObject().classInput;
            let oModel = this.getOwnerComponent().getModel('ZQU_DG_CLASSIFICATION_SRV')
            let oSelectedContext = oEvent.getSource().getBindingContext()
            let sCharName = oSelectedContext.getObject().atnam
            oModel.callFunction('/Get_Characteristics_Data', {
                method: "POST",
                urlParameters: {
                    klart: sKlart,
                    class: sClass
                },
                success: function (oData, oRes) {
                    let aData = JSON.parse(oData.Characteristics_data)
                    let oCharData = aData.find((item) => item.ATNAM === sCharName)
                    debugger;
                    this._OpenCharDialog(oCharData, oSelectedContext)
                    this.getView().setBusy(false)
                }.bind(this),
                error: function (oErr) {
                    this.getView().setBusy(false)
                }.bind(this)
            })
        },
        _OpenCharDialog: function (aData, oSelectedContext) {

            let oCharacteristicsDialog = new sap.m.Dialog({
                title: oSelectedContext.getObject().atnam,
                type: "Message",
                content: [
                    new sap.ui.layout.VerticalLayout({
                        id: 'id::CharDialog::layout',
                        width: "100%",
                        content: [
                            new sap.m.SearchField({
                                id: "searchCharacteristics",
                                placeholder: "Search Characteristics",
                                liveChange: function (oEvent) {
                                    var searchValue = oEvent.getParameter("newValue");
                                    var oList = sap.ui.getCore().byId("CharacteristicsList");
                                    var oBinding = oList.getBinding("items");
                                    var oFilter = new sap.ui.model.Filter({
                                        path: "VALUE_ID", // Adjust this based on your model
                                        operator: sap.ui.model.FilterOperator.Contains,
                                        value1: searchValue
                                    });
                                    oBinding.filter(oFilter);
                                }
                            })
                        ]
                    })
                ],
                beginButton: new sap.m.Button("updateJobConfirmationBtn", {
                    text: "Select",
                    type: "Emphasized",
                    press: function (oEvent) {
                        debugger;
                        let oModel = oSelectedContext.getModel()
                        let sPath = oSelectedContext.getPath() + '/charac_value'
                        let oSelectedItem = sap.ui.getCore().byId('CharacteristicsList').getSelectedItem()
                        if (oSelectedItem) {
                            let sValue;
                            if (oSelectedItem instanceof sap.m.StandardListItem) {
                                let match = oSelectedItem.getTitle().match(/\d+(-\d+)?/)
                                sValue = match ? match[0] : oSelectedItem.getTitle();
                            } else {
                                sValue = oSelectedItem.getContent()[0].getItems()[1].getValue()
                            }
                            oModel.setProperty(sPath, sValue)
                            oModel.submitChanges()
                            oCharacteristicsDialog.close();
                        } else {
                            MessageToast.show('Please select an Item..!!!')
                        }

                    }

                }),
                endButton: new sap.m.Button({
                    text: "Cancel",
                    press: function () {
                        oCharacteristicsDialog.close();
                    }
                }),
                afterClose: function () {
                    oCharacteristicsDialog.destroy();
                }
            });
            oCharacteristicsDialog.setModel(new JSONModel(aData), 'CharValuesModel')

            this._AddListToCharDialog()
            oCharacteristicsDialog.open();
        },
        _AddListToCharDialog: function () {
            let oVerticalLayout = sap.ui.getCore().byId('id::CharDialog::layout')
            let oList = new sap.m.List({
                id: "CharacteristicsList",
                headerText: "Predefined Values",
                mode: "SingleSelectLeft",
                selectionChange: function (oEvent) {
                    let oList = oEvent.getSource()
                    let aItems = oList.getItems()
                    let oSelectedItem = oList.getSelectedItem()
                    if (oSelectedItem instanceof sap.m.CustomListItem) {
                        aItems.forEach((item) => {
                            let oInputField = item.getContent()[0].getItems()[1]
                            item === oSelectedItem ? oInputField.setEditable(true) : oInputField.setEditable(false)
                        })
                    }

                },
                items: {
                    path: "CharValuesModel>/CHAR_VALUE",
                    factory: function (sId, oContext) {
                        debugger;
                        let oData = oContext.getObject();
                        //IF THE INTERVAL IS '1', NO INPUT TO BE SHOWN
                        if (oData.INTERVAL == '1') {
                            return new sap.m.StandardListItem({
                                title: "{CharValuesModel>VALUE_ID} {CharValuesModel>/MSEHI}",
                            });
                        } else {
                            return new sap.m.CustomListItem({
                                content: new sap.m.HBox({
                                    alignItems: "Center",
                                    justifyContent: "SpaceBetween",
                                    items: [
                                        new sap.m.Text({ text: '{CharValuesModel>VALUE_ID} {CharValuesModel>/MSEHI}' }),
                                        new sap.m.Input({
                                            editable: false,
                                            width: '90%',
                                            placeholder: "Enter value from interval",
                                        }).addStyleClass('sapUiSmallMarginBegin'),
                                        new sap.m.Text({ text: '{CharValuesModel>/MSEHI}' }),
                                    ]
                                }),
                            });
                        }
                    }
                }
            })
            oVerticalLayout.insertContent(oList, 1)
        },

        // ****************_______________APPROVE________________***************
        onApprove: function (oEvent) {
            debugger
            let that = this;
            let oApi = this.extensionAPI;
            let matnr = this.getView().getBindingContext().getProperty().Matnr;
            let reqid = this.getView().getBindingContext().getProperty().Reqid;
            let SNo = this.getView().getBindingContext().getProperty().SNo;
            let IsActiveEntity = this.getView().getBindingContext().getProperty().IsActiveEntity;
            let wi_id = this._WorkItemId;
            var oPromise = oApi.invokeActions("/approve", [], { SNo: SNo, Reqid: reqid, Matnr: matnr, WiId: wi_id, Step: "0", IsActiveEntity: IsActiveEntity });
            oPromise
                .then(function (aResponse) {
                    debugger;
                    let successMessage = JSON.parse(aResponse[0].response.response.headers["sap-message"]).message;
                    sap.m.MessageBox.show(successMessage, {
                        icon: sap.m.MessageBox.Icon.SUCCESS,
                        title: "SUCCESS",
                        actions: [sap.m.MessageBox.Action.OK],
                        emphasizedAction: sap.m.MessageBox.Action.OK,
                        onClose: function (oAction) {
                            debugger;
                            if (oAction === sap.m.MessageBox.Action.OK) {
                                that._bIsNavigatingFromExternal ? sap.ui.getCore().navigateExternal('mytasknew.mytasknew', '', {}) : window.history.go(-1)
                            }
                        }
                    });
                })
                .catch(function (oError) {
                    that.getView().setBusy(false);
                    sap.m.MessageToast.show(oError);
                });

        },
        // ****************_______________SUBMIT________________***************
        onSubmit: function (oEvent) {
            if (this.getView().getModel('ui').getProperty('/editable') === true) {
                sap.m.MessageToast.show("Save the data before submitting");
                return
            }

            let that = this;
            sap.m.MessageBox.show("Submit Request?", {
                title: 'Are you sure want to Submit',
                actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
                emphasizedAction: sap.m.MessageBox.Action.OK,
                onClose: function (oAction) {
                    if (oAction === sap.m.MessageBox.Action.OK) {
                        let matnr = that.getView().getBindingContext().getProperty().matnr
                        let DraftUUID = that.getView().getBindingContext().getProperty().DraftUUID
                        let reqid = that.getView().getBindingContext().getProperty().reqid
                        let isActiveEntity = that.getView().getBindingContext().getProperty().IsActiveEntity
                        that.onApprove()


                        // ----------->Comented as action that validates all the record is not present, once that is there, uncoment and replace with that in invoke action
                        // var oPromise = that.extensionAPI.invokeActions("/AC785E442FD1890815DE5A0Validate_existing", [], { reqid: reqid, matnr: matnr, DraftUUID: DraftUUID, IsActiveEntity: isActiveEntity, MatnrInput: matnr, bSuppressMessages: true });
                        // oPromise
                        //     .then(function (aResponse) {
                        //         that.onApprove()
                        //     })
                        //     .catch(function (oError) {
                        //         // Handle error response
                        //         oError = null
                        //         var oMessageManager = sap.ui.getCore().getMessageManager(); // Access MessageManager

                        //         // Clear previous messages
                        //         oMessageManager.removeAllMessages();
                        //         sap.m.MessageToast.show("Found errors, please rectify before submitting \nNavigating to Edit page...");
                        //         var aPromise = that.extensionAPI.invokeActions("/ZC_QU_DG_MaterialsAndRequestsEdit", [], { PreserveChanges: true, reqid: reqid, matnr: matnr, DraftUUID: DraftUUID, IsActiveEntity: true });
                        //         aPromise
                        //             .then(function (aResponse) {
                        //                 console.log("success")
                        //                 let oModel = that.getView().getBindingContext().getModel()
                        //                 let navigateTo = aResponse[0].response.context.sPath;
                        //                 let oContext = new sap.ui.model.Context(oModel, navigateTo);
                        //                 that.extensionAPI.getNavigationController().navigateInternal(oContext);
                        //             })
                        //             .catch(function (oError) {
                        //                 console.log("error")
                        //             });
                        //     });

                    }
                }
            });



        },

        // ****************_______________REJECT________________***************
        onReject: function (oEvent) {
            sap.ui.core.BusyIndicator.show(0)
            var oModel = this.getOwnerComponent().getModel("ZP_QU_DG_MYTASK_BND")
            let sequence = this._Sequence
            let reqid = this.getView().getBindingContext().getProperty().Reqid;

            oModel.read(`/ZI_QU_DG_RejctionVH(iv_reqid='${reqid}',iv_sequence='${sequence}')/Set`, {
                success: function (oData) {
                    let oJsonModel = new sap.ui.model.json.JSONModel(oData.results)
                    this.getView().setModel(oJsonModel, "oRejModel")

                    if (!this._rejectDialog) {
                        this.loadFragment({
                            name: "zmaterialcreate.materialcreate.ext.fragment.Reject"
                        }).then(function (oDialog) {
                            this._rejectDialog = oDialog; // Store the actual dialog instance
                            this._rejectDialog.open();
                            sap.ui.core.BusyIndicator.hide()
                        }.bind(this));
                    } else {
                        // Re-open the dialog if it already exists
                        this._rejectDialog.open();
                        sap.ui.core.BusyIndicator.hide()
                    }
                }.bind(this),
                error: function (oErr) {
                    sap.ui.core.BusyIndicator.hide()
                }
            })
        },

        onCancel: function () {
            if (this._rejectDialog) {
                this._rejectDialog.close();
                this._rejectDialog.destroy();
                this._rejectDialog = null;
            }
        },

        onConfirmReject: async function () {
            debugger;
            let that = this;
            let oCommentInput = this.getView().byId('idRejectComment')
            let oComboBox = this.getView().byId("idrejectip");
            if (oCommentInput.getValue() && oComboBox.getSelectedKey()) {
                try {
                    this._rejectDialog.setBusy(true);
                    let sRejectionComment = oCommentInput.getValue();
                    let rejectInputValue = oComboBox.getSelectedKey();

                    let oApi = this.extensionAPI;
                    let SNo = this.getView().getBindingContext().getProperty().SNo;
                    let reqid = this.getView().getBindingContext().getProperty().Reqid;
                    let matnr = this.getView().getBindingContext().getProperty().Matnr;
                    let IsActiveEntity = this.getView().getBindingContext().getProperty().IsActiveEntity;
                    let wi_id = this._WorkItemId
                    let topLevelWiId = this._TopLevelWiid

                    // Invoke rejection action
                    let aResponse = await oApi.invokeActions("/reject", [], {
                        SNo: SNo,
                        Reqid: reqid,
                        Matnr: matnr,
                        IsActiveEntity: IsActiveEntity,
                        WiId: wi_id,
                        Step: rejectInputValue
                    });

                    if (this._rejectDialog) {
                        this._rejectDialog.close();
                        this._rejectDialog.destroy();
                        this._rejectDialog = null;
                    }

                    // Post request for comments
                    let sLoggedInUser = this.getView().getBindingContext().getObject().user_name
                    let oCommentModel = this.getOwnerComponent().getModel('ZQU_DG_ATTACHMENT_COMMENT_SRV');
                    let oPayload = {
                        InstanceId: topLevelWiId,
                        Id: "",
                        Filename: "USER COMMENTS",
                        Text: sRejectionComment,
                        CreatedAt: new Date(),
                        CreatedBy: sLoggedInUser,
                    };

                    await new Promise((resolve, reject) => {
                        oCommentModel.create("/TaskSet('" + topLevelWiId + "')/TaskToComments", oPayload, {
                            success: resolve,
                            error: reject
                        });
                    });

                    //SHOW SUCCESS MESSAGE
                    let rejectMessage = JSON.parse(aResponse[0].response.response.headers["sap-message"]).message;
                    sap.m.MessageBox.success(rejectMessage, {
                        onClose: function () {
                            that._bIsNavigatingFromExternal ? sap.ui.getCore().navigateExternal('mytasknew.mytasknew', '', {}) : window.history.go(-1)
                        }
                    });

                } catch (oError) {
                    sap.m.MessageToast.show("Rejection failed, please try again.");
                    console.error("Error:", oError);
                } finally {
                    //this._rejectDialog.setBusy(false);
                }

            } else {
                if (!oCommentInput.getValue()) {
                    oCommentInput.setValueState("Error")
                    oCommentInput.setValueStateText("Please add comment to proceed...!!!")
                }


            }


        },

        //___________________________COMMENTS_________________________

        _GetComments: async function (TopLevelWorkItemId) {
            let oCommentLayout = this.getView().byId('id:CommentBox')
            oCommentLayout.setBusy(true)
            let oCommentModel = this.getOwnerComponent().getModel('ZQU_DG_ATTACHMENT_COMMENT_SRV');
            let aAllCommentsList = [];

            // Get comments from local context
            let aCommentsData = this.getView().getBindingContext()?.getProperty('user_comment');
            if (aCommentsData) {
                try {
                    aAllCommentsList = aAllCommentsList.concat(JSON.parse(aCommentsData));
                } catch (e) {
                    console.warn("Failed to parse user_comment JSON:", e);
                }
            }

            // Read comments from backend
            try {
                let backendComments = await new Promise((resolve, reject) => {
                    oCommentModel.read("/TaskSet('" + TopLevelWorkItemId + "')/TaskToComments", {
                        success: function (oData) {
                            resolve(oData.results);
                        },
                        error: function (oError) {
                            reject(oError);
                        }
                    });
                });

                aAllCommentsList = aAllCommentsList.concat(backendComments);
                this._SetCommentsModel(aAllCommentsList);

            } catch (error) {
                sap.m.MessageToast.show("Error Reading Comments data..!!");
                console.error("Error fetching backend comments:", error);
            } finally {
                oCommentLayout.setBusy(false)
            }
        },
        OnImageDelete: function (oEvent) {
            var oView = this.getView();
            var oCtx = oView.getBindingContext();
            var oDataModel = oView.getModel();
            var oDeleteModel = oView.getModel("FileUploadModel");

            if (!oCtx) {
                sap.m.MessageToast.show("Nothing selected.");
                return;
            }

            var sCtxPath = oCtx.getPath();
            var sImagePath = oDataModel.getProperty(sCtxPath + "/path");
            var sReqid = oCtx.getProperty("Reqid");


            if (!sImagePath) {
                sap.m.MessageToast.show("No image to delete.");
                return;
            }


            if (!oDeleteModel) {
                sap.m.MessageToast.show("Delete service model not found.");
                return;
            }
            if (!sReqid) {
                sap.m.MessageToast.show("Missing request id.");
                return;
            }

            var sDeletePath = "/ChangeImageSet(PATH='',REQID='" + encodeURIComponent(sReqid) + "')";

            oDeleteModel.remove(sDeletePath, {
                success: function () {
                    oDataModel.setProperty(sCtxPath + "/path", "");
                    sap.m.MessageToast.show("Image deleted successfully.");
                }.bind(this),
                error: function (oError) {
                    sap.m.MessageToast.show("Error deleting image.");
                }
            });
        },
        _SetCommentsModel: function (aComments) {
            if (aComments.length > 0) {
                let aActions = [{
                    "Text": "Delete",
                    "Icon": "sap-icon://delete",
                    "Key": "DELETE"
                }];

                for (var count = 0; count < aComments.length; count++) {
                    if (aComments[count].Delete === "X") {
                        aComments[count].Actions = aActions;
                    }
                    else {
                        aComments[count].Actions = [];
                    }

                }
            }
            let localModel = new sap.ui.model.json.JSONModel();
            localModel.setData({ "EntryCollection": aComments });
            this.getView().setModel(localModel, "localCommentModel");
        },

        handleUploadComplete: function (oEvent) {
            debugger;
            this.getView().setBusy(false)
            let oResponse = oEvent.getParameters("response");
            if (oResponse.status === 201) {
                let oModel = this.getView().getModel()
                let sPath = this.getView().getBindingContext().getPath()
                let sNewPath = `/SAP/PUBLIC/BC/UI2/QUDG_MATB/${oResponse.fileName}`
                oModel.setProperty(`${sPath}/path`, sNewPath)
                MessageToast.show("Image Uploaded Successfully")
            } else {
                sap.m.MessageBox.error(`
                SOMETHING WENT WRONG \n
                Status:${oResponse.status} \n
                Response:${oResponse.responseRaw}`)
            }
        },

        handleValueChange: function (oEvent) {
            const oFileUploader = oEvent.getSource();

            //check file has been entered
            var sFile = oFileUploader.getValue();
            if (!sFile) {
                sap.m.MessageToast.show("Please select a file first");
                return;
            }
            else {
                this._addTokenToUploader(oFileUploader);
                this.getView().setBusy(true)
            }
        },

        _addTokenToUploader: function (oFileUploader) {
            //Add header parameters to file uploader.
            debugger;
            var oDataModel = this.getView().getModel("FileUploadModel");
            oFileUploader.setModel(oDataModel)
            var sTokenForUpload = oDataModel.getSecurityToken();

            let reqid = this.getView().getBindingContext().getProperty().Reqid;
            let matnr = this.getView().getBindingContext().getProperty().Matnr;
            // let DraftUUID = this.getView().getBindingContext().getProperty().DraftUUID;
            let IsActiveEntity = this.getView().getBindingContext().getProperty().IsActiveEntity;

            var oHeaderParameter = new sap.ui.unified.FileUploaderParameter({
                name: "X-CSRF-Token",
                value: sTokenForUpload
            });

            var sFile = oFileUploader.getValue();

            var oHeaderSlug = new sap.ui.unified.FileUploaderParameter({
                name: "slug",
                value: `${sFile}|${IsActiveEntity}|${reqid}`
            });

            //Header parameter need to be removed then added.
            oFileUploader.removeAllHeaderParameters();
            oFileUploader.addHeaderParameter(oHeaderParameter);

            oFileUploader.addHeaderParameter(oHeaderSlug);
            //set upload url
            var sUrl = oDataModel.sServiceUrl + "/ChangeImageSet";
            oFileUploader.setUploadUrl(sUrl);
            oFileUploader.upload();

        },
        // Code added by Mahesh--------------------->
        onManageRoles: function (oEvent) {
            debugger;
            let oSelectedNodeContext = oEvent.getSource().getBindingContext("StatusLogModel")
            let oSelectedNode = oSelectedNodeContext.getObject()
            let aFilters = [
                new sap.ui.model.Filter("ProcessId", "EQ", this._ProcessId),
                new sap.ui.model.Filter("StepId", "EQ", oSelectedNode.Step_Id),
                new sap.ui.model.Filter("AssignedRole", "NE", ''),
            ]
            this.loadFragment({
                name: "zmaterialcreate.materialcreate.ext.fragment.ManageRolesUsers"
            }).then((oDialog) => {
                this._oPopOverManageRoles = oDialog;
                this._oPopOverManageRoles.setModel(this.getOwnerComponent().getModel('ZP_QU_DG_PRO_STEP_ROLE_CDS'))
                let oList = this.getView().byId("idSmartListRoles")
                let oCustomData = new sap.ui.core.CustomData({
                    key: "filterObject",
                    value: aFilters
                });
                oList.addCustomData(oCustomData);
                oList.rebindList()
                this._oPopOverManageRoles.openBy(oEvent.getSource());
                //initilise the users page
                this.getView().byId("idUsersPage").addEventDelegate({
                    onBeforeShow: function (oEvent) {
                        let sRole = oEvent.data.AssignedRole
                        let sStepId = oEvent.data.StepId
                        let oSmartList = this.getView().byId('idSmartListUsers')
                        oSmartList.addCustomData(
                            new sap.ui.core.CustomData({
                                key: "role",
                                value: sRole,
                            })
                        );
                        oSmartList.addCustomData(
                            new sap.ui.core.CustomData({
                                key: "stepId",
                                value: sStepId,
                            })
                        );
                        oSmartList.rebindList()
                    }.bind(this),

                });
            });

        },
        onBeforeRebindList: function (oEvent) {
            if (oEvent.getSource().getId() === this.getView().getId() + '--idSmartListRoles') {
                let aFilter = oEvent.getSource().getCustomData()[0].getValue()
                oEvent.getParameter("bindingParams").filters = aFilter
            } else if (oEvent.getSource().getId() === this.getView().getId() + '--idSmartListUsers') {
                let oCustomRoleData = oEvent.getSource().getCustomData().find((data) => data.getKey() === "role")
                let oCustomStepData = oEvent.getSource().getCustomData().find((data) => data.getKey() === "stepId")
                if (oCustomRoleData && oCustomStepData) {
                    let sRole = oCustomRoleData.getValue()
                    let sStepId = oCustomStepData.getValue()
                    oEvent.getParameter("bindingParams").filters = [new sap.ui.model.Filter("RoleName", "EQ", sRole), new sap.ui.model.Filter("StepId", "EQ", sStepId)]
                }
            }

        },
        handleClosePopOver: function (oEvent) {
            if (this._oPopOverManageRoles) {
                this._oPopOverManageRoles.close()
            }
        },
        handleOnAfterPopOverClose: function (oEvent) {
            if (this._oPopOverManageRoles) {
                this._oPopOverManageRoles.destroy()
                this._oPopOverManageRoles = null
            }
        },
        handleNavigation: function (oEvent) {
            let oBindingContext = oEvent.getSource().getBindingContext()
            let navCon = this.getView().byId("navCon");
            if (oBindingContext) {
                let oUserspage = this.getView().byId('idUsersPage')
                navCon.to(oUserspage, oBindingContext.getObject());
            } else {
                navCon.back();
            }
        },
        //   End of code added by Mahesh

        //___________________________ATTACHMENTS_________________________
        _getattachment: function () {
            let oUploadSet = this.getView().byId("idUploadSet");
            //oUploadSet.setBusy(true);

            let oModel = this.getOwnerComponent().getModel("CV_ATTACHMENT_SRV");
            let sReqid = this.getView().getBindingContext().getProperty('Reqid')
            oModel.read("/GetAllOriginals", {
                urlParameters: {
                    "ObjectType": "'BUS1006'",
                    "ObjectKey": `'${sReqid}'`,
                    "SemanticObjectType": "''",
                    "IsDraft": false,
                    "AttachmentFramework": "''"
                },
                success: function (oData, oRes) {
                    debugger
                    this.getView().setModel(new sap.ui.model.json.JSONModel(oData.results), "attachmentDetail");
                }.bind(this),
                error: function (oErr) {
                    debugger
                    console.error(oErr);
                }
            });
        },

        //__________________________PRODUCT HEIRARCHY______________
        openPHvaluehelp: function () {
            const oODataModel = this.getOwnerComponent().getModel();
            this.getView().setBusy(true)
            oODataModel.read('/ZC_QUDG_MM_PRODH', {
                success: function (oData) {
                    this.getView().setBusy(false)
                    let aTransformedData = this._buildTree(oData.results)
                    // If dialog is not loaded, load fragment
                    if (!this._PHDialog) {
                        this.loadFragment({
                            name: "zmaterialcreate.materialcreate.ext.fragment.ProductHierarchyVH"
                        }).then(function (oDialog) {
                            this._PHDialog = oDialog;
                            this._PHDialog.setModel(new JSONModel({ data: aTransformedData }), "PHModel");
                            this._PHDialog.open();
                        }.bind(this));
                    } else {
                        this._PHDialog.setModel(new JSONModel({ data: aTransformedData }), "PHModel");
                        this._PHDialog.open();
                    }

                }.bind(this),
                error: function (oError) {
                    this.getView().setBusy(false)
                    sap.m.MessageBox.error("Failed to load Product Hierarchy data.");
                    console.error(oError);
                }.bind(this)
            });
        },
        _buildTree: function (data) {
            const lookup = {};
            const root = [];

            data.forEach(item => {
                lookup[item.NODEID] = {
                    NodeID: item.NODEID,
                    HierarchyLevel: item.HIERARCHY,
                    Description: item.PHDSC,
                    ParentNodeID: item.PARENTNODE || null,
                    DrillState: "leaf",
                    nodes: []
                };
            });

            data.forEach(item => {
                if (item.PARENTNODE && lookup[item.PARENTNODE]) {
                    lookup[item.PARENTNODE].nodes.push(lookup[item.NODEID]);
                    lookup[item.PARENTNODE].DrillState = "expanded"; // has children
                } else {
                    root.push(lookup[item.NODEID]); // no parent → root node
                }
            });

            return root;
        },
        onSelectPH: function (oEvent) {
            let oModel = this.getView().getModel()
            let oSelectedItem = oEvent.getSource().getSelectedContexts()[0].getObject()
            let sPath = this.getView().getBindingContext().getPath() + '/Prdha'
            oModel.setProperty(sPath, oSelectedItem.NodeID)
            this._PHDialog.close()
            this._PHDialog.destroy()
            this._PHDialog = null
        },
        onClosePHDialog: function (oEvent) {
            if (this._PHDialog) {
                this._PHDialog.close()
                this._PHDialog.destroy()
                this._PHDialog = null
            }
        },
        onShowChanges: function (oEvent) {
            var oView = this.getView();
            oView.setBusy(true);

            if (!this.showChangesFragment) {
                this.showChangesFragment = sap.ui.xmlfragment("zmaterialcreate.materialcreate.ext.fragment.ShowValueUpdates", this);
                this.getView().addDependent(this.showChangesFragment);
            }

            this.getDataonShowchanges().then(function () {
                // Get the source control that triggered the popover
                var oSourceControl = oEvent.getSource();
                this.showChangesFragment.openBy(oSourceControl);
                oView.setBusy(false);
            }.bind(this)).catch(function (oError) {
                oView.setBusy(false);
                console.error("Failed to load changes data:", oError);
                sap.m.MessageBox.error("Failed to load change log data");
            }.bind(this));
        },

        onCloseshowChanges: function () {
            if (this.showChangesFragment) {
                this.showChangesFragment.close();
            }
        },

        // getDataonShowchanges: function () {
        //     return new Promise(function (resolve, reject) {
        //         const oModel = this.getOwnerComponent().getModel("ZI_QU_DG_REQLOG_QRY_CDS");
        //         const sModel = this.getOwnerComponent().getModel();
        //         let sReqid = this.getView().getBindingContext().getProperty().Reqid;

        //         // Check if the OData model is properly loaded
        //         if (!oModel) {
        //             reject("OData Model not found.");
        //             return;
        //         }

        //         // Correct entity set reference, use ZI_QU_DG_REQLOG_QRY as the entity set name
        //         oModel.read("/ZI_QU_DG_REQLOG_QRY", {  // Correct entity set name
        //             filters: [new sap.ui.model.Filter("reqid", "EQ", sReqid)],
        //             success: function (oData) {
        //                 var oJSONModel = this.getView().getModel("localReqLog");

        //                 // Create JSON model if it doesn't exist
        //                 if (!oJSONModel) {
        //                     oJSONModel = new sap.ui.model.json.JSONModel();
        //                     this.getView().setModel(oJSONModel, "localReqLog");
        //                 }

        //                 console.log("Original Data from OData:", oData);

        //                 sModel.getMetaModel().loaded().then(function () {
        //                     const oMetaModel = sModel.getMetaModel();

        //                     const entityType = oMetaModel.oMetadata.mEntitySets.ZP_QU_DG_ExsistingMaterialMara;
        //                     console.log("Entity Type:", entityType);



        //                     const allFields = entityType.__entityType.property;  
        //                     console.log("Fields in Entity:", allFields);


        //                     const aFieldLabels = {};


        //                     allFields[0].extensions[1].value.forEach(function (field) {
        //                         if (field["sap:label"]) {
        //                             aFieldLabels[field.name] = field["sap:label"];  // Map technical name to label
        //                         }
        //                     });

        //                     // Log the mapping of technical names to labels
        //                     console.log("Mapped Field Labels:", aFieldLabels);

        //                     // Map technical names to SAP_label names in the retrieved data
        //                     oData.results.forEach(function (item) {
        //                         for (let key in item) {
        //                             if (aFieldLabels[key]) {
        //                                 item["SAP_label"] = aFieldLabels[key];  // Add SAP_label to the item
        //                             }
        //                         }
        //                     });

        //                     console.log("Modified Data with SAP_label:", oData.results);

        //                     // Set the data in the JSON model
        //                     oJSONModel.setData(oData.results || oData);

        //                     if (this.showChangesFragment) {
        //                         this.showChangesFragment.setModel(oJSONModel, "localReqLog");
        //                     }

        //                     resolve();

        //                 }.bind(this)).catch(function (error) {
        //                     console.error("Error loading metadata:", error);
        //                     reject(error);
        //                 });
        //             }.bind(this),
        //             error: function (oErr) {
        //                 console.error("Read failed:", oErr);
        //                 reject(oErr);
        //             }.bind(this)
        //         });
        //     }.bind(this));
        // }

        getDataonShowchanges: function () {
            return new Promise(function (resolve, reject) {
                const oModel = this.getOwnerComponent().getModel("ZI_QU_DG_REQLOG_QRY_CDS");
                const sModel = this.getOwnerComponent().getModel();
                let sReqid = this.getView().getBindingContext().getProperty().Reqid;

                // Check if the OData model is properly loaded
                if (!oModel) {
                    reject("OData Model not found.");
                    return;
                }

                // Correct entity set reference, use ZI_QU_DG_REQLOG_QRY as the entity set name
                oModel.read("/ZI_QU_DG_REQLOG_QRY", {
                    filters: [new sap.ui.model.Filter("reqid", "EQ", sReqid)],
                    success: function (oData) {
                        var oJSONModel = this.getView().getModel("localReqLog");

                        // Create JSON model if it doesn't exist
                        if (!oJSONModel) {
                            oJSONModel = new sap.ui.model.json.JSONModel();
                            this.getView().setModel(oJSONModel, "localReqLog");
                        }

                        console.log("Original Data from OData:", oData);

                        // sModel.getMetaModel().loaded().then(function () {
                        //     const oMetaModel = sModel.getMetaModel();

                        //     const entityType = oMetaModel.oMetadata.mEntitySets.ZP_QU_DG_ExsistingMaterialMara;
                        //     console.log("Entity Type:", entityType);

                        //     const allFields = entityType.__entityType.property;
                        //     console.log("Fields in Entity:", allFields);

                        //     const aFieldLabels = {};

                        //     // Create mapping of field names to their corresponding sap:label from extensions[1].value
                        //     allFields.forEach(function (field) {
                        //         if (field.extensions && field.extensions[1] && field.extensions[1].value) {
                        //             aFieldLabels[field.name] = field.extensions[1].value;  // Map technical name to the label from extensions[1].value
                        //         }
                        //     });

                        //     // Log the mapping of technical names to labels
                        //     console.log("Mapped Field Labels:", aFieldLabels);

                        //     // Map technical names to SAP_label names in the retrieved data
                        //     oData.results.forEach(function (item) {
                        //         for (let key in item) {
                        //             if (aFieldLabels[key]) {
                        //                 item["SAP_label"] = aFieldLabels[key];  // Add SAP_label to the item if there's a match
                        //             }
                        //         }
                        //     });

                        //     console.log("Modified Data with SAP_label:", oData.results);

                        //     // Set the data in the JSON model
                        //     oJSONModel.setData(oData.results || oData);

                        //     if (this.showChangesFragment) {
                        //         this.showChangesFragment.setModel(oJSONModel, "localReqLog");
                        //     }

                        //     resolve();

                        // }.bind(this)).catch(function (error) {
                        //     console.error("Error loading metadata:", error);
                        //     reject(error);
                        // });
                    }.bind(this),
                    error: function (oErr) {
                        console.error("Read failed:", oErr);
                        reject(oErr);
                    }.bind(this)
                });
            }.bind(this));
        }

    };
});