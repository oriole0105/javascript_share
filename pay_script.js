// 初始化圖表
const myChart = echarts.init(document.getElementById('main'));
const fileInput = document.getElementById('fileInput');
const dataInput = document.getElementById('dataInput');
const noteDisplay = document.getElementById('noteDisplay');
const fileInfo = document.getElementById('fileInfo');
const statusDiv = document.getElementById('status');
const toggleButton = document.getElementById('toggleDisplay');

// 示例數據
const sampleData = {
    "years": ["2022", "2023", "2024", "2025"],
    "annualSalaries": [600000, 600000, 600000, 600000],
    "monthlySalaries": [92000, 94900, 100700, 104100],
    "bonuses": [
        [0, 0, 0, 0],                    // 2022: [年終, 下半年績效, 分紅, 上半年績效]
        [161819, 268100, 150000, 66000], // 2023
        [189800, 306000, 197000, 139000],// 2024
        [201400, 312000, 0, 0]           // 2025
    ],
    "note": "2022: 無獎金數據\n2023: 包含首次分紅\n2024: 績效獎金顯著增長\n2025: 部分獎金數據缺失"
};

// 顯示模式：0 為年薪，1 為月薪，2 為獎金
let displayMode = 0;

// 顯示狀態訊息
function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 5000);
}

// 計算衍生數據
function calculateDerivedData(data) {
    const annualRaiseAmounts = [0];
    const annualRaisePercentages = [0];
    const monthlyRaiseAmounts = [0];
    const monthlyRaisePercentages = [0];
    
    for (let i = 1; i < data.years.length; i++) {
        // 年薪相關計算
        const annualRaise = data.annualSalaries[i] - data.annualSalaries[i-1];
        annualRaiseAmounts.push(annualRaise);
        
        const previousAnnual = data.annualSalaries[i-1];
        const annualPercentage = previousAnnual > 0 ? 
            (annualRaise / previousAnnual * 100).toFixed(2) : 0;
        annualRaisePercentages.push(annualPercentage);
        
        // 月薪相關計算
        const monthlyRaise = data.monthlySalaries[i] - data.monthlySalaries[i-1];
        monthlyRaiseAmounts.push(monthlyRaise);
        
        const previousMonthly = data.monthlySalaries[i-1];
        const monthlyPercentage = previousMonthly > 0 ? 
            (monthlyRaise / previousMonthly * 100).toFixed(2) : 0;
        monthlyRaisePercentages.push(monthlyPercentage);
    }
    
    // 獎金數據
    const yearEndBonuses = data.bonuses.map(b => b[0]);
    const secondHalfPerformanceBonuses = data.bonuses.map(b => b[1]);
    const dividendBonuses = data.bonuses.map(b => b[2]);
    const firstHalfPerformanceBonuses = data.bonuses.map(b => b[3]);
    
    return {
        annualRaiseAmounts,
        annualRaisePercentages,
        monthlyRaiseAmounts,
        monthlyRaisePercentages,
        yearEndBonuses,
        secondHalfPerformanceBonuses,
        dividendBonuses,
        firstHalfPerformanceBonuses
    };
}

// 載入數據並更新圖表
function updateChart(data) {
    try {
        // 驗證數據格式
        if (!data.years || !Array.isArray(data.years) || 
            !data.annualSalaries || !Array.isArray(data.annualSalaries) ||
            !data.monthlySalaries || !Array.isArray(data.monthlySalaries) ||
            !data.bonuses || !Array.isArray(data.bonuses) ||
            data.years.length !== data.annualSalaries.length ||
            data.years.length !== data.monthlySalaries.length ||
            data.years.length !== data.bonuses.length) {
            throw new Error("JSON 數據格式不正確。需要 'years', 'annualSalaries', 'monthlySalaries', 'bonuses' 陣列，且長度必須相等。");
        }
        
        // 驗證 bonuses 每年的獎金數量
        for (let i = 0; i < data.bonuses.length; i++) {
            if (!Array.isArray(data.bonuses[i]) || 
                data.bonuses[i].length !== 4) {
                throw new Error(`第 ${i+1} 年的獎金數據必須包含 4 筆數值（年終獎金、下半年績效獎金、分紅獎金、上半年績效獎金）。`);
            }
        }
        
        // 顯示備註
        noteDisplay.value = data.note || "無備註";
        
        const derivedData = calculateDerivedData(data);
        
        const option = {
            title: {
                text: displayMode === 0 ? '年薪成長分析' : 
                      displayMode === 1 ? '月薪成長分析' : '獎金分析'
            },
            tooltip: {
                trigger: 'axis'
            },
            legend: {
                data: displayMode === 0 ? 
                    ['年薪', '年薪增加金額', '年薪增加比例(%)'] :
                    displayMode === 1 ? 
                    ['月薪', '月薪增加金額', '月薪增加比例(%)'] :
                    ['年終獎金', '下半年績效獎金', '分紅獎金', '上半年績效獎金']
            },
            xAxis: {
                type: 'category',
                data: data.years
            },
            yAxis: [
                {
                    type: 'value',
                    name: displayMode === 0 ? '年薪/增加金額 (元)' : 
                          displayMode === 1 ? '月薪/增加金額 (元)' : '獎金 (元)',
                    position: 'left'
                },
                {
                    type: 'value',
                    name: displayMode === 2 ? '' : '增加比例 (%)',
                    position: 'right',
                    axisLabel: {
                        formatter: displayMode === 2 ? '' : '{value} %'
                    }
                }
            ],
            series: displayMode === 0 ? [
                {
                    name: '年薪',
                    type: 'line',
                    data: data.annualSalaries,
                    yAxisIndex: 0,
                    lineStyle: { color: '#FF6384' },
                    itemStyle: { color: '#FF6384' }
                },
                {
                    name: '年薪增加金額',
                    type: 'line',
                    data: derivedData.annualRaiseAmounts,
                    yAxisIndex: 0,
                    lineStyle: { color: '#4CAF50' },
                    itemStyle: { color: '#4CAF50' }
                },
                {
                    name: '年薪增加比例(%)',
                    type: 'line',
                    data: derivedData.annualRaisePercentages,
                    yAxisIndex: 1,
                    lineStyle: { color: '#FFCE56' },
                    itemStyle: { color: '#FFCE56' }
                }
            ] : displayMode === 1 ? [
                {
                    name: '月薪',
                    type: 'line',
                    data: data.monthlySalaries,
                    yAxisIndex: 0,
                    lineStyle: { color: '#36A2EB' },
                    itemStyle: { color: '#36A2EB' }
                },
                {
                    name: '月薪增加金額',
                    type: 'line',
                    data: derivedData.monthlyRaiseAmounts,
                    yAxisIndex: 0,
                    lineStyle: { color: '#9966FF' },
                    itemStyle: { color: '#9966FF' }
                },
                {
                    name: '月薪增加比例(%)',
                    type: 'line',
                    data: derivedData.monthlyRaisePercentages,
                    yAxisIndex: 1,
                    lineStyle: { color: '#FF9F40' },
                    itemStyle: { color: '#FF9F40' }
                }
            ] : [
                {
                    name: '年終獎金',
                    type: 'line',
                    data: derivedData.yearEndBonuses,
                    yAxisIndex: 0,
                    lineStyle: { color: '#FF6384' },
                    itemStyle: { color: '#FF6384' }
                },
                {
                    name: '下半年績效獎金',
                    type: 'line',
                    data: derivedData.secondHalfPerformanceBonuses,
                    yAxisIndex: 0,
                    lineStyle: { color: '#36A2EB' },
                    itemStyle: { color: '#36A2EB' }
                },
                {
                    name: '分紅獎金',
                    type: 'line',
                    data: derivedData.dividendBonuses,
                    yAxisIndex: 0,
                    lineStyle: { color: '#4CAF50' },
                    itemStyle: { color: '#4CAF50' }
                },
                {
                    name: '上半年績效獎金',
                    type: 'line',
                    data: derivedData.firstHalfPerformanceBonuses,
                    yAxisIndex: 0,
                    lineStyle: { color: '#FFCE56' },
                    itemStyle: { color: '#FFCE56' }
                }
            ]
        };
        
        myChart.setOption(option, true);
        showStatus("圖表已成功更新！", "success");
        return true;
    } catch (error) {
        showStatus(`更新圖表時出錯: ${error.message}`, "error");
        return false;
    }
}

// 文件選擇處理
fileInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    fileInfo.textContent = `已選擇文件: ${file.name} (${Math.round(file.size / 1024)} KB)`;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const jsonData = JSON.parse(e.target.result);
            dataInput.value = JSON.stringify(jsonData, null, 2);
            updateChart(jsonData);
        } catch (error) {
            showStatus(`解析 JSON 文件時出錯: ${error.message}`, "error");
            dataInput.value = e.target.result;
        }
    };
    
    reader.onerror = function() {
        showStatus("讀取文件時發生錯誤!", "error");
    };
    
    reader.readAsText(file);
});

// 載入示例數據
document.getElementById('loadSampleData').addEventListener('click', function() {
    dataInput.value = JSON.stringify(sampleData, null, 2);
    updateChart(sampleData);
    fileInfo.textContent = "使用示範數據";
});

// 從文本框更新
document.getElementById('updateFromTextarea').addEventListener('click', function() {
    try {
        const jsonData = JSON.parse(dataInput.value);
        updateChart(jsonData);
    } catch (error) {
        showStatus(`解析 JSON 時出錯: ${error.message}`, "error");
    }
});

// 切換顯示模式
toggleButton.addEventListener('click', function() {
    displayMode = (displayMode + 1) % 3;
    toggleButton.textContent = 
        displayMode === 0 ? '切換至月薪數據' :
        displayMode === 1 ? '切換至獎金數據' : '切換至年薪數據';
    try {
        const jsonData = JSON.parse(dataInput.value);
        updateChart(jsonData);
    } catch (error) {
        showStatus(`切換顯示模式時出錯: ${error.message}`, "error");
    }
});

// 初始加載示例數據
dataInput.value = JSON.stringify(sampleData, null, 2);
updateChart(sampleData);

// 響應式調整
window.addEventListener('resize', function() {
    myChart.resize();
});
