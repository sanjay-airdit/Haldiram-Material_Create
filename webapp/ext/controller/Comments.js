sap.ui.define(["sap/m/MessageBox"], function (MessageBox) {
    "use strict";

    return {
        onSenderPress: function () {
            MessageBox.show("Button Sender pressed!");
        },
        onIconPress: function () {
            MessageBox.show("Button Icon pressed!");
        },
        onPost: function (oEvent) {
            const oSource = oEvent.getSource();
            const sTopLevelWorkItemID = this._TopLevelWiid;
            const oContext = this.getView().getBindingContext();
            const sUserName = oContext?.getObject()?.req_created_by;

            const oPayload = {
                Id: "",
                Filename: "USER COMMENTS",
                CreatedAt: new Date(),
                CreatedBy: sUserName,
                Text: oEvent.getParameter("value")
            };

            if (sTopLevelWorkItemID) {
                const oCommentModel = this.getOwnerComponent().getModel('ZQU_DG_ATTACHMENT_COMMENT_SRV');
                oPayload.InstanceId = sTopLevelWorkItemID;

                oSource.setBusy(true);

                oCommentModel.create(`/TaskSet('${sTopLevelWorkItemID}')/TaskToComments`, oPayload, {
                    success: (oData, response) => {
                        oSource.setBusy(false);
                        this._GetComments(sTopLevelWorkItemID);
                    },
                    error: (oError) => {
                        oSource.setBusy(false);
                        sap.m.MessageToast.show("Something went wrong..!!");
                    }
                });

            } else {
                // No top-level ID yet: Store in local property
                let aAllComments = oContext?.getProperty("user_comment") ?? "[]";
                try {
                    aAllComments = JSON.parse(aAllComments);
                } catch (e) {
                    aAllComments = [];
                }

                oPayload.InstanceId = '';
                oPayload.Delete = "X";
                aAllComments.push(oPayload);

                const oViewModel = this.getView().getModel();
                oViewModel.setProperty(`${oContext.getPath()}/user_comment`, JSON.stringify(aAllComments));

                oViewModel.submitChanges({
                    success: () => this._GetComments(sTopLevelWorkItemID),
                    error: () => sap.m.MessageBox.error("Failed to save local comment.")
                });
            }
        },

        // readComments: function (workItem, model) {
        //     model.read("/TaskSet('" + workItem + "')/TaskToComments", oPayload, {
        //         success: jQuery.proxy(function (mOdata, response) {
        //             console.log("success");
        //             console.log(mOdata);

        //         }, this),
        //         error: jQuery.proxy(function (oError) {

        //             try {
        //                 var msg = JSON.parse(oError.responseText).error.innererror.errordetails[0].message;
        //                 sap.m.MessageBox.error(msg, {
        //                     title: "Error",
        //                     id: "messagexxxddBoxId1"


        //                 });
        //             } catch (e) {
        //                 sap.m.MessageBox.error("Error message", {
        //                     title: "Error",
        //                     id: "messageddBoxId1"


        //                 });
        //             }

        //         }, this)
        //     });
        // },
        onActionPressed: function (oEvent) {
            let sAction = oEvent.getSource().getKey();
            let oCommentModel = this.getOwnerComponent().getModel('ZQU_DG_ATTACHMENT_COMMENT_SRV')
            let commentData = oEvent.getSource().getParent().getBindingContext('localCommentModel').getObject()


            if (sAction === "DELETE") {
                //IF THE COMMENTS IS STRORED IN THE THE "user_comment" PROPERTY 
                if (!commentData.InstanceId) {
                    let oContext = this.getView().getBindingContext();
                    let aAllComments = JSON.parse(oContext?.getProperty("user_comment"));
                    let aFilteredComments = aAllComments.filter((item) => item.CreatedAt != commentData.CreatedAt)
                    
                    const oViewModel = this.getView().getModel();
                    oViewModel.setProperty(`${oContext.getPath()}/user_comment`, JSON.stringify(aFilteredComments));
                    oViewModel.submitChanges({
                        success: () => {
                            this._GetComments();
                            sap.m.MessageToast.show("Comment Deleted")
                        },
                        error: () => sap.m.MessageBox.error("Failed to save local comment.")
                    });

                } else {
                    oCommentModel.remove("/CommentSet(InstanceId='" + commentData.InstanceId + "',Id='" + commentData.Id + "')", {
                        success: function (mOdata, response) {
                            sap.m.MessageToast.show('Comment Deleted..!!')
                            this._GetComments(commentData.InstanceId);
                        }.bind(this),
                        error: function (oError) {
                            sap.m.MessageToast.show('Soemthing went wrong..!!')
                        }
                    });
                }


            }

        }

    };
});