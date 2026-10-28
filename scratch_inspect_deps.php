<?php
$js = file_get_contents('https://p2mi.sippmi.com/build/assets/app-CBR8IZ6H.js');
preg_match_all('/"assets\/[^"]+\.js"/', $js, $matches);
echo "Deps found: " . count($matches[0]) . "\n";
foreach (array_slice(array_unique($matches[0]), 0, 10) as $dep) {
    $depUrl = 'https://p2mi.sippmi.com/build/' . trim($dep, '"');
    $h = @get_headers($depUrl);
    echo $dep . " -> " . ($h ? $h[0] : 'failed') . "\n";
}
