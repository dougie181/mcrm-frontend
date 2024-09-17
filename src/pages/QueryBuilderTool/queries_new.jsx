// queries.js - DO NOT DELETE

export const SampleQuery = `SELECT 
    CAST('[' || GROUP_CONCAT(DISTINCT '{"accountID":"' || accounts."accountID" || 
        '","Name":"' || accounts."accountName" || 
        '","Type":"' || accounts."productType" ||
        '","Risk Profile":"' || clients."riskProfile" || '"}'
    ) || ']' AS TEXT) AS "custom.accountDetails",
    CAST('[' || GROUP_CONCAT(
        DISTINCT '{"Account":"' || accounts."accountID" || 
        '","Code":"' || products."productCode" ||
        '","Product name":"' || products."productName" ||
        '","Asset type":"' || risk_profile."asset_type" ||
        '","Amount owned":"' || printf('$%,.2f', products."marketValue") ||
        '","Current percentage":"' || printf('%.2f%%', products."percentage") || 
        '","Target percentage":"' || printf('%.2f%%', [targetPercentage]) || 
        '","Action":"' || CASE 
            WHEN products."percentage" < [targetPercentage]
            THEN 'BUY'
            ELSE 'SELL'
        END || 
        '","Amount":"' || printf('$%,.2f', ABS((products."percentage" - [targetPercentage]) * products."marketValue" / 100)) || 
        '"}'
    ) || ']' AS TEXT) AS "custom.tradeDetails",
     CAST('[' || GROUP_CONCAT(
        DISTINCT '{"Account":"' || accounts."accountID" || 
        '","Account value":"' || printf('$%,.2f', accounts."marketValue") ||
        '","Cash cleared":"' || printf('$%,.2f', accounts."cashCleared")  || '"}'
    ) || ']' AS TEXT) AS "custom.accountValues",
    clients.*
FROM clients
JOIN accounts ON clients."accountID" = accounts."accountID"
JOIN products ON clients."accountID" = products."accountID"
JOIN risk_profile ON clients."riskProfile" = risk_profile."risk_profile" AND products."assetType" = risk_profile."asset_type"
WHERE clients.riskProfile IN [selectRiskProfile]
AND products.productCode IN ([selectedProductCode])
AND ABS((products."percentage" - [targetPercentage]) * accounts."marketValue" / 100) > [thresholdAmount]
AND clients.active = 1
AND clients.customerType <> 'Wholesale'
GROUP BY clients.email
ORDER BY clients.email;`