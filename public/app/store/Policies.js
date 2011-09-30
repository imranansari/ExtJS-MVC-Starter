Ext.define('Pending.store.Policies', {
	
	extend: 'Ext.data.Store',
	model: 'Pending.model.Policy',
	autoLoad: true,
	
	proxy: {
		type: 'ajax',
		api: {
			read: 'data/policies.json'
		},
		reader: {
			type: 'json',
			root: 'policies',
			successProperty: 'success'
		}
	}
});