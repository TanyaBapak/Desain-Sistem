<?php
$html = file_get_contents('https://p2mi.sippmi.com/');
if (preg_match('/data-page="([^"]+)"/', $html, $m)) {
    $json = html_entity_decode($m[1], ENT_QUOTES);
    $data = json_decode($json, true);
    echo "Props keys: " . json_encode(array_keys($data['props'])) . "\n";
    echo "trainingCatalog: " . json_encode($data['props']['trainingCatalog'] ?? null) . "\n";
    echo "kpiSummary: " . json_encode(isset($data['props']['landingKpiSummary'])) . "\n";
    echo "projection: " . json_encode(isset($data['props']['landingProjection'])) . "\n";
} else {
    echo "No data-page match\n";
}
