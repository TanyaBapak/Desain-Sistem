<?php
$html = file_get_contents('https://p2mi.sippmi.com/');
preg_match('/data-page="([^"]+)"/', $html, $m);
$json = html_entity_decode($m[1], ENT_QUOTES);
$data = json_decode($json, true);
$proj = $data['props']['landingProjection'];
echo "proj keys: " . json_encode(array_keys($proj)) . "\n";
echo "placementTargets count: " . count($proj['placementTargets'] ?? []) . "\n";
