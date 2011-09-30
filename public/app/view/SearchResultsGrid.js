Ext.define('Pending.view.SearchResultsGrid' , {

	extend: 'Ext.grid.Panel',	
	alias : 'widget.searchResults',
	title : 'Pending Policies',
	store: 'Policies',

	columns: [{
		header: 'Policy',
		dataIndex: 'polNumber',
		flex: 1
	},{
		header: 'Client Name',
		dataIndex: 'clientName',
		flex: 1
	}]
});