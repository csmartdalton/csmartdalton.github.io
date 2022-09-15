<?
    $workout = array(
        array('name' => 'Back', 'exercises' => array(
            array('name' => 'Chin Up', 'sets' => array(8, 8)),
            array('name' => 'One Arm Dumbell Row', 'sets' => array(8, 8, 8)),
            array('name' => 'Hammer Strength Row', 'sets' => array(8, 8)),
            array('name' => 'Lat Pull Down', 'sets' => array(10, 10, 8)),
            array('name' => 'Seated Row', 'sets' => array(15, 15)),
        )), array('name' => 'Biceps', 'exercises' => array(
            array('name' => 'Standing Barbell Curl', 'sets' => array(8, 8, 6)),
            array('name' => 'Drag Curl', 'sets' => array(8, 8, 6)),
            array('name' => 'Incline Dumbbell Curl', 'sets' => array('12 - 14', '12 - 14')),
            array('name' => 'Concentration Curl', 'sets' => array(10, 10)),
            array('name' => 'Comments')
        ))
    );
?>

<style>
    body {
        padding: 0;
        margin: 0;
        zoom: .75;
        -webkit-print-color-adjust: exact;
    }
    .page {
        padding: 50px 75px;
        font-family: 'trebuchet MS', 'Lucida sans', Arial;
        color: #444;
        font-size: 18px;
        width: 400px;
    }
    .page hr {
        color: #aaa;
        background-color: #bbb;
        height: 1px;
        border: 0;
        margin-top: 2px;
    }
    table {
        *border-collapse: collapse; /* IE7 and lower */
        border-spacing: 0;
        color: inherit;
        font-size: 15px;
    }
    .box {
        width: 100%;
        border: solid #ccc 1px;
        border-radius: 6px;
        margin-bottom: 30px;
    }
    .box td, .box th {
        border-left: 1px solid #ccc;
        border-top: 1px solid #ccc;
        padding: 10px;
        text-align: left;    
    }
    .box .title {
        border-top: none;
        border-left: none;
        background-color: #ddd;
        padding: 7px 10px 7px 10px;
    }
    .box .target {
        border-left: none;
        background-color: #eee;
        width: 40%;
    }
    .box .comments {
        border-left: none;
        height: 150px;
    }
    .box .actual {
        width: 60%;
    }
</style>

<table><tr>
<?foreach ($workout as &$muscle) {?>
    <td class='page' valign='top'>
        <?=$muscle['name']?><hr />
        <?foreach ($muscle['exercises'] as &$exercise) {?>
            <?if ($exercise['name'] != 'Comments') {?>
                <table class='box'>
                    <tr><td class='title' colspan='2'><?=$exercise['name']?></td></tr>
                    <?foreach ($exercise['sets'] as &$set) {?>
                        <tr><td class='target'><?=$set?></td><td class='actual'></td></tr>
                    <?}?>
                </table>
            <?} else {?>
                <table class='box'>
                    <tr><td class='title'>Comments</td></tr>
                    <tr><td class='comments'></td></tr>
                </table>
            <?}?>
        <?}?>
    </td>
<?}?>
</tr></table>
