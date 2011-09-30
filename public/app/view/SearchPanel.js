Ext.define('Pending.view.SearchPanel', {
    extend: 'Ext.form.Panel',
    alias : 'widget.search',

    frame:true,
    title: 'Search',
    bodyStyle:'padding:5px 5px 0',
    width: 350,
    fieldDefaults: {
        msgTarget: 'side',
        labelWidth: 75
    },
    defaultType: 'textfield',
    defaults: {
        anchor: '100%'
    },

    items: [
        {
            xtype: 'combo',
            fieldLabel: 'Search By',

            store: new Ext.data.SimpleStore({
                data: [
                    [1, 'Policy Number'],
                    [2, 'Client Last Name'],
                    [3, 'Agent Name']
                ],
                id: 0,
                fields: ['value', 'text']
            }),
            valueField: 'value',
            displayField: 'text',
            triggerAction: 'all',
            editable: false

        },
        {
            fieldLabel: 'Search Value',
            name: 'searchValue',
            allowBlank:false
        }
    ],

    buttons: [
        {
            text: 'Search',
            action: 'search'
        },
        {
            text: 'Cancel'
        }
    ]
});