function updateDashboard(data) {
    console.log('🎛️ Updating dashboard with:', data);
    
    const symbols = data.symbols || {};
    const symbolKeys = Object.keys(symbols);
    const activeCount = symbolKeys.length;
    
    console.log('📈 Active symbols:', activeCount, symbolKeys);
    
    document.getElementById('activeCount').textContent = activeCount;
    
    if (activeCount > 0) {
        // Hide waiting state, show chart
        document.getElementById('waitingState').style.display = 'none';
        document.getElementById('chartContainer').style.display = 'block';
        
        // Select first symbol if none selected
        if (!currentSymbol || !symbols[currentSymbol]) {
            currentSymbol = symbolKeys[0];
            console.log('🔍 Selected symbol:', currentSymbol);
        }
        
        // Update symbol data
        if (currentSymbol && symbols[currentSymbol]) {
            console.log('📊 Updating UI for:', currentSymbol);
            updateSymbolData(symbols[currentSymbol]);
        }
        
        // Update symbol list
        updateSymbolList(symbols);
        
        // Show success in console
        console.log('✅ Dashboard updated successfully!');
    } else {
        console.log('⚠️ No symbols in data');
        showWaitingState('no_data', 
            'No Data Received',
            'EA connection detected but no trading data received.'
        );
    }
}
