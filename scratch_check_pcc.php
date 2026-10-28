<?php
$html = file_get_contents('https://p2mi.sippmi.com/');
preg_match('/data-page="([^"]+)"/', $html, $m);
$json = html_entity_decode($m[1], ENT_QUOTES);
$data = json_decode($json, true);
$pcc = $data['props']['publicCommandCenter'];
echo "PCC keys: " . json_encode(array_keys($pcc)) . "\n";
echo "national: " . json_encode($pcc['national']) . "\n";
echo "previewDirectories: " . json_encode(array_keys($pcc['previewDirectories'])) . "\n";
echo "institutions count: " . count($pcc['previewDirectories']['institutions']) . "\n";
