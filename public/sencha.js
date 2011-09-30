/*
 * kevin.clark@lfg.com or kevin.clark@objsoft.com
 */


function logThis(text) {
    if ((window['console'] !== undefined)) {
        console.log(text);
    }
}

function uniqueId(genericId) {
    logThis(Ext.select(genericId));
    return Ext.select(genericId).elements[0].id;
}

function renderDate(date) {
    return Ext.Date.format(date, 'mm/dd/yyyy');
}
/*
 * The main pending application controller code for Sencha implementation
 *
 */

PendingApp = function(appId) {
    // search filter variables and functions
    var letterSelection = '';
    var searchFilter = '';				// default filter.
    var pageSize = 10;					// default page size

    var searchUrl = 'http://localhost:8087/pending-service-ui-war/services/pending/policies/joebob';
    var searchType = 'scripttag';				// cross domain support using scripttag vs ajax
    //  var searchUrl = '../pending/result.json';
    //  var searchType = 'ajax';

    var useCredentials = true;
    var resultGridId = appId + 'pending' + 'ResultGrid';
    var pendingGoButton = 'PendingGoButton';

    // constant for the display info on grids
    var displayInfo = 'Displaying Selected Statuses {0} - {1} of {2}';

    var errorMessages = [];
    /*
     * Component ids on the UI
     */
    var searchFilterId = uniqueId('*[id*=searchFilter]');
    var dateSearchFilterId = uniqueId('*[id*=dateSearchFilter]');
    var criteriaTypesId = uniqueId('*[id*=criteriaTypes]');
    var calendarSelectorId = uniqueId('*[id*=calendarSelector]');
    var timingsId = uniqueId('*[id*=timings]');
    var pdfIcon = uniqueId('*[id*=pdfIcon]');
    var excelIcon = uniqueId('*[id*=excelIcon]');
    var printIcon = uniqueId('*[id*=printIcon]');
    var expandAllLink = uniqueId('*[id*=expandAll]');
    var collapseAllLink = uniqueId('*[id*=collapseAll]');
    var formLevelMsgContainer = uniqueId('*[id*=formLevelMessagesContainer]');
    var savedSettingMenu = uniqueId('*[id*=SavedSettingMenu]');
    var statusCodeListJsonId = uniqueId('*[id*=statusCodeListJson]');


    // initialize the check box JSON
    var checkBoxJson = Ext.decode(Ext.get(statusCodeListJsonId).dom.value);
    var allStatusObj = {description: 'All Statuses', code:'All', style: 'font-weight: bold;'};
    checkBoxJson.unshift(allStatusObj);
    console.log(checkBoxJson);

    // default status selections
    var statusSelections = ["Issued","Pending","Quote"];


    var rowExpander = null;
    var tabs = null;
    var grid3 = null;
    var store3 = null;
    var pagingBar = null;
    //var pagingComboBox = null;

    var ServiceTime = 0;
    var ESBTime = 0;
    var HTTPCallTime = 0;
    var RenderTime = 0;
    //var StartTime = 0;
    var StartRenderTime = 0;
    var detailsTemplate = null;
    //var pageSizes = [5,10,25,50,100,150];

    /*
     * Search book functions
     */
    function switchTools() {
        var id = 'PendingExtendedTools';
        if (document.getElementById(id).style.display == 'none') {
            showdiv(id);
            document.getElementById('pendingImgSearch').src = '/ms-resources-war/f9/image/Search-Minimize.png';
            renderCheckBoxes();
        } else {
            hidediv(id);
            document.getElementById('pendingImgSearch').src = '/ms-resources-war/f9/image/Search-MoreTools.png';
        }
    }

    /*
     * Get the template for details
     */

    Ext.Ajax.request({
        url: '/pending-portlet-ext-war/pending/detailsTpl.html',
        success: function(r) {
            detailsTemplate = Ext.apply(new Ext.XTemplate(r.responseText), {
                //	   			displayDate: function(date){
                //	   					return Ext.Date.format(date, 'm-d-Y');
                //	   				}
            });
            logThis(detailsTemplate);
        }
    });

    /*
     * Get the template for full details
     */
    Ext.Ajax.request({
        url: '/pending-portlet-ext-war/pending/fullDetailsTpl.html',
        success: function(r) {
            fullDetailsTemplate = Ext.apply(new Ext.XTemplate(r.responseText), {
                //	   			displayDate: function(date){
                //	   					return Ext.Date.format(date, 'm-d-Y');
                //	   				}
            });
            logThis(fullDetailsTemplate);
        }
    });

    /*
     * This function will render the table of checkboxes. Note: you cannot use this function
     * unless the div tag id is visible otherwise Sencha will not render component.
     */

    function renderCheckBoxes() {
        for (var i = 0; i < checkBoxJson.length; i = i + 1) {
            checkBoxJson[i].boxLabel = checkBoxJson[i].description;
            // replace spaces with underscore
            checkBoxJson[i].id = checkBoxJson[i].description.replace(/ /g, "_");
            checkBoxJson[i].inputValue = checkBoxJson[i].code;
            if (Ext.Array.contains(statusSelections, checkBoxJson[i].description)) {
                checkBoxJson[i].checked = true;
            }
        }
        console.log(checkBoxJson);
        Ext.create('Ext.container.Container', {
            width: 500,
            layout: {
                type: 'table',
                columns: 4
            },
            defaults: {
                // applied to each contained panel
                bodyStyle:'padding: 2px; padding-right:2px; font-size: 12px;',
                xtype: 'checkbox'
            },
            items: checkBoxJson,
            renderTo: Ext.get("statusCheckBoxesTable")
        });
        // register events on checkbox click actions
        Ext.get(checkBoxJson[0].id).on('click', selectAllStatus);
        for (var i = 1; i < checkBoxJson.length; i = i + 1) {
            Ext.get(checkBoxJson[i].id).on('click', updateStatusLabel);
        }
    }

    /*
     * Update the status label when checkbox selection changes
     */
    function updateStatusLabel() {
        if (Ext.getCmp(checkBoxJson[0].id) != null) {
            statusSelections = [];
            if (Ext.getCmp(checkBoxJson[0].id).checked) {
                statusSelections.push(checkBoxJson[0].description);
            } else {
                for (var i = 1; i < checkBoxJson.length; i++) {
                    if (Ext.getCmp(checkBoxJson[i].id).checked) {
                        statusSelections.push(checkBoxJson[i].description);
                    }
                }
            }
        }
        var statusSels = '';
        for (var i = 0; i < statusSelections.length; i++) {
            statusSels = statusSels + statusSelections[i];
            if (i < statusSelections.length - 1) {
                statusSels = statusSels + ', ';
            }
        }
        Ext.get('StatusSummary').dom.innerHTML = statusSels;
        validateSearchCriteria();
        updateErrorMessages();
    }

    /*
     * Validate search criteria prior to searching
     *
     */
    function validateSearchCriteria() {
        errorMessages = [];

        if (statusSelections.length == 0) {
            errorMessages.push("You must select one status option");
        }
        // must enter a date for activity date search
        var selection = Ext.get(criteriaTypesId).dom.value;
        if ("ACTIVITY_DATE" == selection) {
            var date = Ext.Date.parseDate(Ext.get(dateSearchFilterId).dom.value, 'M j, Y');
            if (date == undefined) {
                errorMessages.push('You must enter a valid date');
            }
        }
        updateErrorMessages();
    }


    function updateErrorMessages() {

        if (errorMessages.length == 0) {
            //var el = Ext.get("formLevelMessagesContainer");
            //el.slideOut();
            hidediv("messages");
        } else {
            // TODO - update the error messages
            var errorMsgs = '<ul>';
            for (i = 0; i < errorMessages.length; i++) {
                errorMsgs = errorMsgs + '<li>' + errorMessages[i] + '</li>';
            }
            errorMsgs = errorMsgs + '</ul>';
            console.log(Ext.get("formLevelMessagesContainer"));
            Ext.get("formLevelMessagesContainer").dom.innerHTML = errorMsgs;

            showdiv("messages");
            //var el = Ext.get("formLevelMessagesContainer");
            //el.slideIn();
        }
    }

    /*
     * Simple function to make all checkboxes the same when selecting or unselecting the
     * "All Statuses" checkbox
     */
    function selectAllStatus() {
        // must get component and not dom because Sencha is controlling components
        var checked = Ext.getCmp(checkBoxJson[0].id).checked;
        // set all the other checkboxes
        for (var i = 1; i < checkBoxJson.length; i = i + 1) {
            Ext.getCmp(checkBoxJson[i].id).setValue(checked);
        }
        updateStatusLabel();
    }

    ;

    /*
     * Clear all criteria on search
     */
    function clearAllCriteria() {
        Ext.get(searchFilterId).dom.value = '';
        for (var i = 0; i < checkBoxJson.length; i = i + 1) {
            Ext.getCmp(checkBoxJson[i].id).setValue(false);
        }
        Ext.get(dateSearchFilterId).dom.value = '';
        updateStatusLabel();
        validateSearchCriteria();
    }

    ;

    /*
     * Reset All criteria in search
     */
    function resetAllCriteria() {
        Ext.get(searchFilterId).dom.value = '';
        Ext.get(dateSearchFilterId).dom.value = '';
        statusSelections = ["Issued","Pending","Quote"];


        for (var i = 0; i < checkBoxJson.length; i = i + 1) {
            if (Ext.Array.contains(statusSelections, checkBoxJson[i].description)) {
                Ext.getCmp(checkBoxJson[i].id).setValue(true);
            } else {
                Ext.getCmp(checkBoxJson[i].id).setValue(false);
            }
        }
        Ext.get(criteriaTypesId).dom.value = 'CLIENT_NAME';
        criteriaChange();
        updateStatusLabel();
    }

    ;

    // register click events
    Ext.get('PendingMoreTools').on('click', switchTools);
    Ext.get('PendingClearAllCriteria').on('click', clearAllCriteria);
    Ext.get('PendingResetButton').on('click', resetAllCriteria);
    Ext.get('SavedSettingMenu').on('change', changeSettings);

    // initially call label update function
    updateStatusLabel();

    // setup criteria change
    function criteriaChange() {
        var selection = Ext.get(criteriaTypesId).dom.value;
        if ("ACTIVITY_DATE" == selection) {
            showdiv("dateFilter");
            hidediv("textFilter");
        } else {
            hidediv("dateFilter");
            showdiv("textFilter");
        }
        validateSearchCriteria();
    }

    function selectDate() {
        var selection = Ext.get(criteriaTypesId).dom.value;
        if ("ACTIVITY_DATE" == selection) {
            var dateField = Ext.get(dateSearchFilterId);
            /*
             Ext.menu.DatePicker.prototype.renderTpl = [
             '<div class="{cls}" id="{id}" role="grid" title="{ariaTitle} {value:this.longDay}">',
             '<div role="presentation" class="{baseCls}-header">',
             '<div class="{baseCls}-prev"><a href="#" role="button" title="{prevText}"></a></div>',
             '<div class="{baseCls}-month"></div>',
             '<div class="{baseCls}-next"><a href="#" role="button" title="{nextText}"></a></div>',
             '</div>',
             '<table class="{baseCls}-inner" cellspacing="0" role="presentation">',
             '<thead role="presentation"><tr role="presentation">',
             '<tpl for="dayNames">',
             '<th role="columnheader" title="{.}"><span>{.:this.firstInitial}</span></th>',
             '</tpl>',
             '</tr></thead>',
             '<tbody role="presentation"><tr role="presentation">',
             '<tpl for="days">',
             '{#:this.isEndOfWeek}',
             '<td role="gridcell" id="{[Ext.id()]}">',
             '<a role="presentation" href="#" hidefocus="on" class="{parent.baseCls}-date" tabIndex="1">',
             '<em role="presentation"><span role="presentation"></span></em>',
             '</a>',
             '</td>',
             '</tpl>',
             '</tr></tbody>',
             '</table>',
             '<tpl if="showToday">',
             '<div role="presentation" class="{baseCls}-footer"></div>',
             '</tpl>',
             '</div>',
             {
             firstInitial: function(value) {
             return value.substr(0,2);
             },
             isEndOfWeek: function(value) {


             value--;
             var end = value % 7 === 0 && value !== 0;
             return end ? '</tr><tr role="row">' : '';
             },
             longDay: function(value){
             return Ext.Date.format(value, 'F d, Y');
             }
             }
             ];
             */
            var dateMenu = Ext.create('Ext.menu.ExtendedDatePicker', {
                readOnly:true,
                allowBlank:true,
                //cls: 'foo',
                //baseCls: 'x-lfgdatepicker',
                width: 195,
                format:'m/d/Y',
                handler: function(dp, date) {
                    dateField.dom.value = Ext.Date.format(date, 'M j, Y');
                    criteriaChange();
                },
                showToday: false
                //renderTpl: new Ext.XTemplate(tpl)
            });


            var r = dateField.getRegion();
            dateMenu.setPosition(r.left, r.bottom);
            dateMenu.show();
        }
    }

    /*
     * Change page size
     */
    // TODO push into custom grid component
    window.changePageSize = function changePageSize() {
        var pageSizeId = uniqueId('*[id*=pendingResultGrid-pageSize]');
        pageSize = Ext.get(pageSizeId).dom.value;
        basicStore.fireEvent('load');
    };

    function setPageSizeCombo() {
        var pageSizeId = uniqueId('*[id*=pendingResultGrid-pageSize]');
        Ext.get(pageSizeId).dom.value = '' + pageSize;
    }

    ;

    /*
     * This will build the search filter to search pending policies
     */
    function buildSearchFilter() {
        var type = Ext.get(criteriaTypesId).dom.value;
        searchFilter = "type=" + type + ",";
        if ("ACTIVITY_DATE" == type) {
            var date = Ext.Date.parseDate(Ext.get(dateSearchFilterId).dom.value, 'M j, Y');
            if (date == undefined) {
                errorMessages.push('You must enter a valid date');
                updateErrorMessages();
                return;
            }
            var dateQueryString = Ext.Date.format(date, 'm/d/Y');
            searchFilter = searchFilter + "query='" + dateQueryString + "',";
        } else {
            searchFilter = searchFilter + "query=" + Ext.get(searchFilterId).dom.value + ",";
        }
        searchFilter = searchFilter + "statuses=";
        if (statusSelections[0] == checkBoxJson[0].description) {
            // start at 1 to skip ALLSTATUSES
            for (var i = 1; i < checkBoxJson.length; i = i + 1) {
                searchFilter = searchFilter + (checkBoxJson[i].code.toUpperCase()) + ":";
            }
        } else {
            for (i = 1; i < checkBoxJson.length; i = i + 1) {
                if (Ext.Array.contains(statusSelections, checkBoxJson[i].description)) {
                    searchFilter = searchFilter + checkBoxJson[i].code + ":";
                }
            }
        }
    }

    /*
     * Search for pending apps
     */
    function search() {
        buildSearchFilter();
        showMessageBox();

        Start = new Date().getTime();

        basicStore.load({
            start:0,
            limit:pageSize,
            params: getExtraParams()
        });
    }

    function showMessageBox() {
        Ext.MessageBox.show({
            title: 'Searching...',
            msg: 'Loading items for search filter = ' + searchFilter,
            progressText: 'Searching...',
            width:300,
            wait: true,
            waitConfig: {interval:200},
            animateTarget: pendingGoButton
        });
    }

    function closeWaitingMessageBox() {
        if (!Ext.MessageBox.hidden) {
            Ext.MessageBox.hide();
        }
        //Ext.example.msg('Done', 'Your data items were loaded!');
    }

    function showTimings() {
        Ext.MessageBox.alert('Timings',
                'Service Time =' + ServiceTime + 'ms<br>' +
                        'ESB Time =' + ESBTime + 'ms<br>' +
                        'HTTP Call  =' + HTTPCallTime + 'ms<br>' +
                        'Render time =' + RenderTime + 'ms<br>'
                );
    }

    function exportToPDF() {
        Ext.MessageBox.alert('PDF',
                'This will export to PDF'
                );
        var doc = new jsPDF();
        doc.text(20, 20, 'Hello world!');
        doc.text(20, 30, 'This is a client-side jsPDF example.');
        content = doc.output();
        document.location = 'data:application/pdf;base64,' + Base64.encode(content);
    }

    function exportToExcel() {

        var exportStore = new Ext.data.Store({
            model: 'PendingSummary',
            proxy: new Ext.data.PagingMemoryProxy(myData),
            reader: new Ext.data.JsonReader({
                root: 'pendingPolicies',
                totalProperty: 'totalCount'
            }),
            pageSize: myData.totalCount,
            remoteSort: true
        });
        exportStore.load();
        // build a new grid with all elements for export
        var exportGrid = new Ext.grid.GridPanel({
            width:920,
            minHeight:290,
            height: 290,
            title: 'Export of Results',
            cls: resultGridId,
            stripeRows: true,
            store: exportStore,
            disableSelection:false,
            loadMask: true,
            columns: getGridColumns(),
            viewConfig: {
                forceFit:true,
                showPreview:false,
                scrollOffset: 0
            }
            //,
            // paging bar on the bottom
            //bbar: pagingBar
        });
        var workbook = new Ext.ux.Exporter.ExcelFormatter.Workbook({title: exportGrid.title, columns: exportGrid.columns});
        workbook.addWorksheet(exportStore, {title: exportGrid.title, columns: exportGrid.columns});
        // add will replace matching styles
        workbook.addStyle({
            id: "even",
            attributes: [
                {
                    name: "Interior",
                    properties: [
                        {name: "Pattern", value: "Solid"},
                        {name: "Color",   value: "#F3F7FB"}
                    ]
                }
            ]
        });
        workbook.addStyle({
            id: "odd",
            attributes: [
                {
                    name: "Interior",
                    properties: [
                        {name: "Pattern", value: "Solid"},
                        {name: "Color",   value: "#999999"}
                    ]
                }
            ]
        });
        logThis(workbook.render());
        document.location = 'data:application/vnd.ms-excel;base64,' + Base64.encode(workbook.render());

        //var result = Ext.ux.Exporter.exportGrid(grid3);
        //console.log(result);
        //document.location='data:application/vnd.ms-excel;base64,' + Base64.encode(grid3.getExcelXml());

    }

    function exportToPrint() {
        Ext.MessageBox.alert('Print',
                'This will export to Print'
                );
    }

    /*
     * Event registrations
     */
    Ext.get(pendingGoButton).on('click', search);
    Ext.get(calendarSelectorId).on('click', selectDate);
    Ext.get(dateSearchFilterId).on('focus', selectDate);
    Ext.get(criteriaTypesId).on('change', criteriaChange);
    Ext.get(timingsId).on('click', showTimings);
    Ext.get(pdfIcon).on('click', exportToPDF);
    Ext.get(excelIcon).on('click', exportToExcel);
    Ext.get(printIcon).on('click', exportToPrint);
    Ext.get(expandAllLink).on('click', expandAll);
    Ext.get(collapseAllLink).on('click', collapseAll);


    /*
     * Global displayDate function for other functions
     */
    window.displayDate = function (timestamp) {
        var date = new Date(timestamp);
        return Ext.Date.format(date, 'm-d-Y');
    };

    window.displayMoney = function (value) {
        return Ext.util.Format.usMoney(value);
    };

    /*
     * Models
     */

    Ext.regModel('OutstandingRequirements', {
        fields: [
            {name: 'statusDescription',            type: 'string'},
            {name: 'lastStatusDate',              type: 'date', convert: window.displayDate}
        ]
    });

    Ext.regModel('PendingSummary', {
        fields: [
            {name: 'polNumber',            type: 'string'},
            {name: 'policyDate',        type: 'date', convert: window.displayDate},
            {name: 'productType',          type: 'string'},
            {name: 'productName',          type: 'string'},
            {name: 'lastActivityDate',  type: 'date', convert: window.displayDate},
            {name: 'issueState',          type: 'string'},
            {name: 'status',              type: 'string'},
            {name: 'premiumAmount',      type: 'float'},
            {name: 'modalPremiumAmount', type: 'float'},
            {name: 'cashWithApp', type: 'float'},
            {name: 'agentFirstName',    type: 'string', mapping:'agentsList[0].firstName'},
            {name: 'agentLastName',        type: 'string', mapping:'agentsList[0].lastName'},
            {name: 'agentNumber',        type: 'string', mapping:'agentsList[0].agentNumber'},
            {name: 'splitPercent',        type: 'float', mapping:'agentsList[0].splitPercent'},
            {name: 'contactName',        type: 'string', mapping:'contactInfo.contactName'},
            {name: 'contactEmail',        type: 'string', mapping:'contactInfo.contactEmail'},
            {name: 'appEntryDate',      type: 'date', convert: window.displayDate},
            //{name: 'appEntryDate',		type: 'int'},
            {name: 'amount',            type: 'float'},
            {name: 'lineOfBusiness',    type: 'string'},
            'openOutstandingRequirements',
            'outstandingRequirements',
            {name: 'clientInfo', mapping: 'clientsList[0]'},
            {name: 'product'},
            {name: 'uwInfo'},
            {name: 'contactInfo'},
            {name: 'benefitInfo'},
            {name: 'clientDateOfBirth',    type: 'date', mapping:'clientsList[0].dateOfBirth', convert: window.displayDate},
            {name: 'clientLastName',    type: 'string', mapping:'clientsList[0].lastName'}

        ]
        //    	,
        //        associations: [
        //                       {type: 'hasMany', model: 'OutstandingRequirements',    name: 'outstandingRequirements'}
        //        ]
    });


    /*
     * Search results
     */

    function getExtraParams() {
        return {letter:letterSelection, filter:searchFilter};
    }


    function dblclickHandler(grid, rowIndex, e) {
        //var id = grid.getDataModel().getRowId(rowIndex);
        var win = Ext.create('widget.window', {
            title: 'Layout Window',
            closable: true,
            closeAction: 'hide',
            //animateTarget: this,
            width: 600,
            height: 350,
            layout: 'border',
            bodyStyle: 'padding: 5px;',
            items: [
                {
                    region: 'west',
                    title: 'Navigation',
                    width: 200,
                    split: true,
                    collapsible: true,
                    floatable: false
                },
                {
                    region: 'center',
                    xtype: 'tabpanel',
                    items: [
                        {
                            title: 'Bogus Tab',
                            html: 'Hello world 1'
                        },
                        {
                            title: 'Another Tab',
                            html: 'Hello world 2'
                        },
                        {
                            title: 'Closable Tab',
                            html: 'Hello world 3',
                            closable: true
                        }
                    ]
                }
            ]
        });
        win.show(this);
    }

    // initialize with 'data' since reader is ignored on paging memory proxy
    // this is a hack to show the table. in the load listener in the basicStore
    // below will reload the grid
    var myData = {"data":[],"totalCount":0,"callbackMethod":""};

    var pagingProxy = new Ext.data.PagingMemoryProxy(myData);

    var store2 = new Ext.data.Store({
        model: 'PendingSummary',
        proxy: pagingProxy,
        reader: new Ext.data.JsonReader({
            root: 'pendingPolicies',        // for some reason this is ignored
            totalProperty: 'totalCount'
        }),
        pageSize: pageSize,
        remoteSort: true
    });
    var emptyBar = new Ext.toolbar.Paging({
        store: store2,
        displayInfo: true,
        displayMsg: displayInfo,
        emptyMsg: "No policies to display"
    });
    // remove the preview
    emptyBar.items.items[9].hide();
    emptyBar.items.items[10].hide();

    var emptyGrid = new Ext.grid.GridPanel({
        id : resultGridId,
        width:920,
        autoHeight: true,
        //minHeight:290,
        title: renderTitle(resultGridId),
        cls: resultGridId,
        stripeRows: true,
        store: store2,
        trackMouseOver:false,
        disableSelection:false,
        loadMask: true,

        // grid columns
        columns: getGridColumns(),
        viewConfig: {
            forceFit:true,
            enableRowBody:true,
            showPreview:false
        },
        // paging bar on the bottom
        bbar: emptyBar
    });
    // trigger load
    store2.load({});

    tabs = Ext.createWidget('tabpanel', {
        renderTo : 'pendingresultstabs',
        activeTab : 0,
        width : 923,
        autoHeight: true,
        plain : true,
        defaults : {
            bodyPadding : 0
        },
        items : [ new Ext.panel.Panel(
        {title: 'Results', items: [emptyGrid]}
                )
        ]
    });

    // initial combo on empty grid
    setPageSizeCombo();


    function getGridColumns() {
        return [
            {
                id: 'clientName', // id assigned so we can apply custom css (e.g. .x-grid-col-topic b { color:#333 })
                header: "CLIENT NAME",
                dataIndex: 'clientLastName',
                flex: 1,
                width: 125,
                renderer: renderClientName,
                printRenderer: renderClientNamePlain,
                sortable: true
            },
            {
                id: 'policy',
                header: "POLICY",
                dataIndex: 'polNumber',
                width: 100,
                renderer: renderPolicyNo,
                printRenderer: renderPolicyNoPlain,
                sortable: true
            },
            {
                id: 'productType',
                header: "PRODUCT TYPE",
                dataIndex: 'productType',
                width: 170,
                renderer: renderProductType,
                printRenderer: renderProductTypePlain,
                sortable: true
            },
            {
                id: 'writingAgent',
                header: "WRITING AGENT",
                dataIndex: 'agentLastName',
                width: 175,
                renderer: renderWritingAgent,
                sortable: true
            },
            {
                id: 'lastActivity',
                header: "LAST ACTIVITY",
                dataIndex: 'lastActivitySort',
                width: 100,
                renderer: renderLastActivity,
                sortable: true
            },
            {
                id: 'status',
                header: "STATUS",
                dataIndex: 'status',
                width: 75,
                sortable: true
            },
            {
                id: 'total',
                header: "TOTAL/ANN PREMIUM",
                dataIndex: 'premiumAmount',
                width: 125,
                renderer: renderTotal2,
                sortable: true
            }
        ];

    }

    var basicStore = new Ext.data.Store({
        model: 'PendingSummary',
        proxy:  {
            type: searchType,
            url: searchUrl,
            //        	headers : {
            //        		'Authorization' : 'Basic '
            //        				+ Base64.encode(username
            //        								+ ':'
            //        								+ password)
            //        	},
            reader: {
                type: 'json',
                root: 'pendingPolicies',
                totalProperty: 'totalCount'
            },
            timeout: 120000,
            listeners: {
                exception: function() {
                    closeWaitingMessageBox();
                    Ext.MessageBox.alert('Search Timeout', 'Search exceeded 2 minutes.');
                }
            },
            extraParams: getExtraParams()
        },

        listeners: {
            load: function() {
                HTTPCallTime = new Date().getTime() - Start;

                // we are going to build after data is loaded
                // need to add reader config data
                StartRenderTime = new Date().getTime();
                Ext.applyIf(this.proxy.reader.jsonData, {"reader": {root: 'pendingPolicies'}});
                myData = this.proxy.reader.jsonData;
                logThis(myData);
                if (myData !== undefined) {
                    ESBTime = myData.common.timings.ESBTiming;
                    ServiceTime = myData.common.timings.JSONServiceTiming;
                }

                var pluginExpanded = false;
                store3 = new Ext.data.Store({
                    model: 'PendingSummary',
                    proxy: new Ext.data.PagingMemoryProxy(myData),
                    reader: new Ext.data.JsonReader({
                        root: 'pendingPolicies',
                        totalProperty: 'totalCount'
                    }),
                    pageSize: pageSize,
                    remoteSort: true
                });
                pagingBar = new Ext.toolbar.Paging({
                    store: store3,
                    displayInfo: true,
                    displayMsg: displayInfo,
                    emptyMsg: "No contracts to display",
                    items:[
                        '-', {
                            text: 'Show Preview',
                            pressed: pluginExpanded,
                            enableToggle: true,
                            toggleHandler: function(btn, pressed) {
                                Ext.MessageBox.alert('Not Implemented', 'Will show more detail per a line.');
                                var preview = Ext.getCmp(resultGridId).getPlugin('preview');
                                //preview.toggleExpanded(pressed);
                            }
                        },
                        '-']
                });
                // remove the refresh
                // TODO - use better method that hardcoded numbers
                pagingBar.items.items[9].hide();
                pagingBar.items.items[10].hide();
                // removes the old grid
                Ext.getCmp(resultGridId).destroy();

                grid3 = new Ext.grid.GridPanel({
                    id : resultGridId,
                    width:920,
                    //minHeight:290,
                    //height: 41*pageSize-5,
                    autoHeight: true,
                    // scroll: 'vertical',
                    title: renderTitle(resultGridId),        // must match id of component
                    cls: resultGridId,
                    stripeRows: true,
                    store: store3,
                    trackMouseOver:false,
                    disableSelection:false,
                    loadMask: true,
                    columns:getGridColumns(),
                    plugins: [
                        //                    {
                        //                        ptype: 'preview',
                        //                        pluginId: 'preview',
                        //                        bodyField: 'clientLastName',
                        //                        expanded: false
                        //                    },
                        {
                            ptype: 'extendedrowexpander',
                            pluginId: resultGridId + 'rowexpander',
                            //rowBodyTpl : '<p><table border="1"><tr><td colspan="5">hello</td></tr><tr><td>Client Name</td><td>Requirement</td><td>Status</td><td>Status Date</td><td>Comment</td></tr></table></p>',
                            rowBodyTpl: detailsTemplate.html,            // get the raw html for the row expander
                            expandOnEnter: false,
                            viewConfig: {
                                getRowClass : function(record, rowIndex, p, store) {
                                    if (pluginExpanded) {
                                        //console.log("here");
                                        p.body = '<p>' + record.data.clientLastName + '</p>';
                                        return 'x-grid3-row-expanded';
                                    } else {
                                        //console.log("not here");
                                    }
                                    return 'x-grid3-row-collapsed';
                                }
                            }
                        }
                    ],
                    //autoScroll: true,
                    viewConfig: {
                        forceFit:true,
                        showPreview:false,
                        scrollOffset: 0
                    },
                    // paging bar on the top and bottom
                    tbar: pagingBar,
                    bbar: pagingBar
                });


                // render it
                if (tabs == null) {
                    tabs = Ext.createWidget('tabpanel', {
                        renderTo : 'pendingresultstabs',
                        activeTab : 0,
                        width : 923,
                        autoHeight: true,
                        plain : true,
                        defaults : {
                            bodyPadding : 0
                        },
                        items : [ new Ext.panel.Panel(
                        {title: 'Results', items: [grid3]}
                                )
                        ]
                    });
                } else {
                    tabs.remove(tabs.getComponent(0));
                    tabs.insert(0, new Ext.panel.Panel(
                    {title: 'Results', items: [grid3]}
                            )).show();
                }


                //grid3.render('pendingresults');
                // catch the load event to update the title
                store3.on({
                    'load':{
                        fn: function(store, records, options) {
                            closeWaitingMessageBox();
                            //store is loaded, now you can work with it's records, etc.
                            updateTitleBarOnGrid(grid3, pagingBar);
                            setPageSizeCombo();
                        },
                        scope:this
                    }
                });
                // load the grid with data from defined store
                store3.load();

                rowExpander = grid3.getPlugin(resultGridId + 'rowexpander');
                RenderTime = new Date().getTime() - StartRenderTime;

            }
        }
    });
    // work around for a that does not pickup root on reader in
    // PagingMemoryProxy
    Ext.applyIf(myData, {"reader": {root: 'pendingPolicies'}});


    var inlineStore = new Ext.data.Store({
        model: 'PendingSummary',
        proxy: new Ext.data.MemoryProxy(myData),
        reader: new Ext.data.JsonReader({
            root: 'pendingPolicies',
            totalProperty: 'totalCount'
        }),
        pageSize: pageSize,
        remoteSort: true
    });

    // load initial results on page hit
    //showMessageBox();
    //basicStore.load({});


    // quick, dirty way to define global function so accessible from html scope.
    // an alternative means would be id each link and attach a onclick event to it
    window.setLetterSearchFilter = function setLetterSearchFilter(newLetterSelection) {
        letterSelection = newLetterSelection;
        Ext.getCmp(resultGridId).store.clearFilter();
        if (letterSelection !== '') {
            Ext.getCmp(resultGridId).store.filter({property:'clientLastName',value:letterSelection});
        }
        Ext.getCmp(resultGridId).store.load();
        Ext.getCmp(resultGridId).store.loadPage(1);
    };

    function getRecordForPolicy(policyNo) {
        for (i = 0; i < pagingBar.store.data.length; i++) {
            var record = pagingBar.store.getAt(i);
            if (record.data.polNumber == policyNo) {
                return record;
            }
        }
        return null;
    }

    window.policyDetail = function policyDetail(policy) {
        var record = getRecordForPolicy(policy);
        var openIds = Ext.Array.pluck(record.data.openOutstandingRequirements, "id");
        var closedRequirements =
                Ext.Array.filter(record.data.outstandingRequirements,
                        function (item) {
                            return !Ext.Array.contains(openIds, item.id);
                        },
                        this
                        );
        // set derived field
        record.data.closedRequirements = closedRequirements;

        tabs.add({
            title: policy,
            html: fullDetailsTemplate.applyTemplate(record.data),
            closable: true,
            autoScroll: true
        }).show();
    };

    // pluggable renders for grid
    function renderClientName(value, p, record) {
        return Ext.String.format(
                '<b>{0}, {1}</b>',
                record.data.clientInfo.lastName, record.data.clientInfo.firstName);
    }

    function renderClientNamePlain(value, p, record) {
        return Ext.String.format(
                '{0}, {1}',
                record.data.clientInfo.lastName, record.data.clientInfo.firstName);
    }

    function renderPolicyNo(value, p, record) {
        return Ext.String.format(
                '<span style="text-decoration: underline; cursor: pointer;" onclick="javascript:policyDetail(\'{0}\'); return false;">{0}</span>',
                record.data.polNumber);
    }

    function renderPolicyNoPlain(value, p, record) {
        return Ext.String.format(
                '{0}',
                record.data.polNumber);
    }

    function renderProductType(value, p, record) {
        return Ext.String.format('{0}<br>{1}', record.data.productType, record.data.productName);
    }

    function renderProductTypePlain(value, p, record) {
        return Ext.String.format('{0}\n\r{1}', record.data.productType, record.data.productName);
    }

    function renderWritingAgent(value, p, record) {
        return Ext.String.format('{0}, {1}', record.data.agentLastName, record.data.agentFirstName);
    }

    function renderLastActivity(value, p, record) {
        // var date = new Date(record.data.lastActivityDate);
        // return Ext.String.format('{0}', Ext.Date.format(date,'m-d-y'));
        return record.data.lastActivityDate;
    }

    function renderTotal(value, p, record) {
        if (record.data.product.type == 'Life') {
            return Ext.util.Format.usMoney(record.data.premiumAmount);
        }
        return Ext.String.format('NA');
    }

    function renderTotal2(value, p, record) {
        if (record.data.productType == 'Life') {
            return Ext.util.Format.usMoney(record.data.premiumAmount);
        }
        return Ext.String.format('NA');
    }


    function renderTitle(aGridId) {
        var result = "";
        var str = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (var i = 0; i < str.length; i++) {
            var nextChar = str.charAt(i);
            result = result + "<a href=\"#\" onclick=\"javascript:setLetterSearchFilter('" + nextChar + "'); return false\">";
            result = result + nextChar;
            result = result + "</a>  ";
        }
        result = result + "<a href=\"#\" onclick=\"javascript:setLetterSearchFilter(''); return false\">ALL</a>";

        var expandAll = '<div id="' + aGridId + '-expand" style="cursor: pointer;">Expand All</div>';
        var collapseAll = '<div id="' + aGridId + '-collapse" style="cursor: pointer;">Collapse All</div>';
        var titleId = '<div id="' + aGridId + '-titlesummary" >No policies to display</div>';
        var pageSizeSelection = '<select id=' + aGridId + '-pageSize" name="pageSize" size="1" onchange=\"javascript:changePageSize(); return false;\"><option value="5">5</option><option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="100">100</option><option value="150">150</option></select>';
        //var pageSizeSelection = '<div id="'+aGridId+'-pageSize" ></div>';
        return '<table class="x-toolbar-text" style="font-size: 11px; font-weight: normal;" width="910px"><tr><td>' + result + '</td><td align="right">' + pageSizeSelection + '</td><td align="right">' + expandAll + '</td><td align="right">' + collapseAll + '</td><td align="right">' + titleId + '</td></tr></table>';
    }

    function expandAll() {
        rowExpander.expandAll();
    }

    function collapseAll() {
        rowExpander.collapseAll();
    }

    /*
     * This displays the titlebar on the grid
     */
    function updateTitleBarOnGrid(aGrid, aBbar) {
        Ext.get(aGrid.id + '-expand').on('click', expandAll);
        Ext.get(aGrid.id + '-collapse').on('click', collapseAll);
        var pageData = aBbar.getPageData();
        var summary = Ext.String.format(displayInfo, pageData.fromRecord, pageData.toRecord, pageData.total);
        var titleId = '' + aGrid.id + '-titlesummary';
        Ext.get(titleId).dom.innerHTML = summary;
    }

    /*
     * Create a settings object and send change events to it
     */
    // TODO - more work here to abstract and make setting generalized and integrated into portal
    // prefs
    var settings = new LFG.Settings();
    settings.init();

    function changeSettings() {
        settings.changeSettings("pending");
    }

    ;

};