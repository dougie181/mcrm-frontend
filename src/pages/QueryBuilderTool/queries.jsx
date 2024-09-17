// queries.js - DO NOT DELETE

export const SampleQuery = `SELECT 
    CAST('[' || GROUP_CONCAT(
        DISTINCT '{"ID":"' || accounts."accountID" || 
        '","Name":"' || accounts."accountName" || 
        '","Type":"' || accounts."productType" || '"}'
    ) || ']' AS TEXT) AS "custom.accountList",
    CAST('[' || GROUP_CONCAT(
        DISTINCT '{"Account":"' || accounts."accountID" || 
        '","Code":"' || products."productCode" ||
        '","Product name":"' || products."productName" ||
        '","Type":"' || risk_profile."asset_type" ||
        '","Actual percentage":"' || printf('%.2f%%', products."percentage") || 
        '","Target percentage":"' || printf('%.2f%%', risk_profile."percentage") || 
        '","Amount":"' || printf('$%,.2f', ABS((products."percentage" - risk_profile."percentage") * products."marketValue" / 100)) || 
        '","Action":"' || CASE 
            WHEN products."percentage" < risk_profile."percentage"
            THEN 'BUY'
            ELSE 'SELL'
        END || '"}'
    ) || ']' AS TEXT) AS "custom.tradeDetails",
    CAST('[' || GROUP_CONCAT(
        DISTINCT '{"Account":"' || accounts."accountID" || 
        '","Account value":"' || printf('$%,.2f', accounts."marketValue") ||
        '","Cash cleared":"' || printf('$%,.2f', accounts."cashCleared")  || '"}'
    ) || ']' AS TEXT) AS "custom.accountDetails",
    CAST('[' || GROUP_CONCAT(
        DISTINCT '{"Account":"' || accounts."accountID" || 
        '","Product code":"' || products."productCode" ||
        '","Market value":"' || printf('$%,.2f', products."marketValue") ||
        '","Asset type":"' || products."assetType" || '"}'
    ) || ']' AS TEXT) AS "custom.productDetails",
    printf('%.2f%%', [percentageThreshold]) as "custom.selectedPercentageThreshold",
    CAST(printf('$%,.2f', [amountThreshold]) AS TEXT) as "custom.selectedAmountThreshold",
    [productCode] as "custom.selectedProductCode",
    clients.*
FROM clients
JOIN accounts ON clients."accountID" = accounts."accountID"
JOIN products ON clients."accountID" = products."accountID"
JOIN risk_profile ON clients."riskProfile" = risk_profile."risk_profile" AND products."assetType" = risk_profile."asset_type"
WHERE clients.riskProfile IN [riskProfile]
AND products.productCode IN ([productCode])
AND (
    (products."percentage" - risk_profile."percentage" > [percentageThreshold]) 
    OR 
    (risk_profile."percentage" - products."percentage" > [percentageThreshold])
)
AND ABS((products."percentage" - risk_profile."percentage") * accounts."marketValue" / 100) > [amountThreshold]
AND clients.active = 1
AND clients.customerType <> 'Wholesale'
GROUP BY clients.email
ORDER BY clients.email;`