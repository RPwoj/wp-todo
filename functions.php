<?php

// Disable Gutenberg on the back end.
add_filter( 'use_block_editor_for_post', '__return_false' );

// Disable Gutenberg for widgets.
add_filter( 'use_widgets_block_editor', '__return_false' );

add_action( 'wp_enqueue_scripts', function() {
    // Remove CSS on the front end.
    wp_dequeue_style( 'wp-block-library' );

    // Remove Gutenberg theme.
    wp_dequeue_style( 'wp-block-library-theme' );

    // Remove inline global CSS on the front end.
    wp_dequeue_style( 'global-styles' );

    // Remove classic-themes CSS for backwards compatibility for button blocks.
    wp_dequeue_style( 'classic-theme-styles' );

    wp_enqueue_style('main-styles', get_template_directory_uri() . '/assets/css/main.css');
}, 20 );


add_action('init', 'register_menus');

function register_menus() {
    register_nav_menu('footer-menu', __('Footer Menu'));
    register_nav_menu('home-menu-logged', __('Home Menu Logged'));
    register_nav_menu('home-menu-unlogged', __('Home Menu Unlogged'));
    register_nav_menu('navbar-menu', __('Navbar Menu'));
}


add_action("wp_ajax_order_update", "order_update");
add_action("wp_ajax_nopriv_order_update", "order_update");

function order_update() {
    global $wpdb;
    if (isset($_POST['task_order'])) {
        $order_number = $_POST['task_order'];
        $task_id = $_POST['id'];
        $done_task = $wpdb->get_row( "SELECT done FROM wptd_tasks WHERE id = $task_id" );
        if ($done_task->done == 0) {
            $wpdb->update(
                'wptd_tasks',
                array(
                    'group_order' => $order_number,
                ),
                array(
                    'id' => $task_id, 
                )
            );
        } else {
            $wpdb->update(
                'wptd_tasks',
                array(
                    'group_order' => 999,
                ),
                array(
                    'id' => $task_id, 
                )
            );
        }
    }
}


add_action('wp_enqueue_scripts', 'newScripts');

function newScripts() {
    wp_register_script('script-2', get_template_directory_uri() . '/assets/js/main2.js');
    wp_enqueue_script( 'script-2' );
}


function get_url_id() {
    if (isset($_GET['id'])) {
        return $_GET['id'];
    }
}


function get_current_date() {
    date_default_timezone_set('Europe/Warsaw');
    $current_datetime = date("Y-m-d H:i:s");
    return $current_datetime;
}


function check_if_user_is_group_owner($group_id = null, $user_id = null) {
    global $wpdb;

    if ($group_id == null && $user_id == null) {
        $group_id = $_GET['id'];
        $user_id = get_current_user_id();
    }

    $data = array('group' => $group_id, 'user' => $user_id);
    $results = $wpdb->get_results( "SELECT id FROM wptd_groups WHERE owner = $user_id AND id = $group_id" );
    return $results ? true : false;
}


function check_last_group_el($group_id) {
    global $wpdb;

    $results = $wpdb->get_results( "SELECT MAX(group_order) as group_order FROM wptd_tasks WHERE task_group = $group_id AND group_order < 999" );

    if($results) {
        return $results[0]->group_order + 1;
    }
}


add_action("wp_ajax_add_task", "add_task");
add_action("wp_ajax_nopriv_add_task", "add_task");

function add_task() {
    global $wpdb;

    if (isset($_POST['task_name'])) {
        $task_name = $_POST['task_name'];
        $group_id = $_POST['group_id'];

        if (check_number_of_tasks_in_group($group_id) < 16) {
            
            $response['task_name'] = $task_name;
            
            if ($task_name != '') {
                $wpdb->insert(
                    'wptd_tasks',
                    array(
                        'name' => $task_name,
                        'done' => 0,
                        'owner' => 1,
                        'task_group' => $group_id,
                        'group_order' => check_last_group_el($group_id),
                        'done_date' => NULL,
                        'done_by' => NULL
                    )
                );
                
                $response['info'] = 'Task added'; 
            } else {
                $response['info'] = 'Task name cant be empty!';
            }

        } else {
            $response['max'] = true;
        }

    } else {
        $response['info'] = 'Form error';
    }

    wp_send_json($response);
}


add_action("wp_ajax_done_task", "done_task");
add_action("wp_ajax_nopriv_done_task", "done_task");

function done_task() {
    global $wpdb;
    $id_to_update = $_POST['id']; 
    $result = $wpdb->get_results( "SELECT done FROM wptd_tasks WHERE id = $id_to_update" );

    if ($result[0]->done == 0) {
        
        $wpdb->update(
            'wptd_tasks',
            array(
                'done' => 1,
                'group_order' => 999,
            ),
            array(
                'id' => $id_to_update,
            )
        );
    }
    wp_send_json($result);
}


add_action("wp_ajax_undone_task", "undone_task");
add_action("wp_ajax_nopriv_undone_task", "undone_task");

function undone_task() {
    global $wpdb;
    $id_to_update = $_POST['id']; 
    $result = $wpdb->get_row( "SELECT done, task_group FROM wptd_tasks WHERE id = $id_to_update" );

    if ($result->done == 1) {
        
        $wpdb->update(
            'wptd_tasks',
            array(
                'done' => 0,
                'group_order' => check_last_group_el($result->task_group),
            ),
            array(
                'id' => $id_to_update,
            )
        );
    }
    wp_send_json($result);
}


add_action("wp_ajax_remove_task", "remove_task");
add_action("wp_ajax_nopriv_remove_task", "remove_task");

function remove_task() {
    global $wpdb;
    if (isset($_POST['id'])) {
        $id_to_remove = $_POST['id'];
    }

    $wpdb->delete(
        'wptd_tasks',
        array(
            'ID' => $id_to_remove,
        )
    );
}


function remove_outdated_done_tasks($tasks) {
    foreach($tasks as $task) {
        $done_date =  $task->done_date;

        if($done_date) {
            $current_datetime = date("Y-m-d H:i:s");
            echo $done_date;

            $done_date_converted = new DateTime($done_date);
            $current_datetime_converted = new DateTime($current_datetime);

            $done_date_converted->add(new DateInterval('P7D'));
            
            print_r($done_date_converted);
            print_r($current_datetime_converted);

            if ($current_datetime_converted > $done_date_converted) {
                echo 'minelo';
            } else {
                echo 'nie minelo';
            }
        }
    }
}


add_action("wp_ajax_show_tasks", "show_tasks");
add_action("wp_ajax_nopriv_show_tasks", "show_tasks");

function show_tasks() {
    global $wpdb;
    $group_id = $_POST['group_id'];
    $current_user = get_current_user_id();

    if (check_if_user_is_group_member($group_id, $current_user)) {
        $results = $wpdb->get_results( "SELECT * FROM wptd_tasks WHERE task_group = $group_id ORDER BY group_order" );
        $response = json_encode($results);
    } else {
        $response['info'] = 'brak dostepu';
    }

    wp_send_json($response);
}


function check_number_of_tasks_in_group($group_id) {
    global $wpdb;
    $results = $wpdb->get_results( "SELECT * FROM wptd_tasks WHERE task_group = $group_id" );
    return sizeof($results);
}


function check_current_user_group_quantity($user_id) {
    global $wpdb;
    $results = $wpdb->get_results( "SELECT * FROM wptd_groups WHERE owner = $user_id" );
    
    return (count($results) < 3) ? true : false;
}


add_action("wp_ajax_check_user_in_group", "check_user_in_group");
add_action("wp_ajax_nopriv_check_user_in_group", "check_user_in_group");

function check_user_in_group() {
    $group_id = $_POST['group_id'];
    $current_user_id = get_current_user_id();

    if (!check_if_user_is_group_member($group_id, $current_user_id)) {
        $response['error'] = 'not allowed';
        $code = 404; 
    } else {
        $response['info'] = 'ok';
        $code = 200; 
    }

    wp_send_json($response, $code);
}


function check_if_user_is_group_member($group_id, $user_id) {
    global $wpdb;
    $results = $wpdb->get_results( "SELECT * FROM wptd_groups_members WHERE group_id = $group_id AND main_user_id = $user_id" );

   return $results ? true : false;
}


function add_group_member($group_id, $user_id, $status = 3) {
    /*
    status:
    1 - group member
    2 - invited by current user
    3 - invited current user
     */
    global $wpdb;

    $wpdb->insert(
        'wptd_groups_members',
        array(
            'group_id' => $group_id,
            'main_user_id' => $user_id,
            'target_user_id' => 0,
            'status' => $status
        )
    );
}


function check_if_user_exist($user_id) {
    global $wpdb;
    $result = $wpdb->get_row( "SELECT id FROM wptd_users WHERE id = $user_id");
    return $result ? true : false;
}


function check_if_group_relation_exist($group_id, $current_user, $friendID) {
    global $wpdb;
    $result = $wpdb->get_row( "SELECT id FROM wptd_groups_members WHERE group_id = $group_id && main_user_id = $current_user && target_user_id = $friendID" );

    return $result;
}


add_action("wp_ajax_invite_friend_to_group", "invite_friend_to_group");
add_action("wp_ajax_nopriv_invite_friend_to_group", "invite_friend_to_group");

function invite_friend_to_group() {
    global $wpdb;
    $current_user = get_current_user_id();

    if (isset($_POST['friend_id']) && isset($_POST['group_id'])) {
        $response['friend_id'] = $_POST['friend_id'];
        $response['group_id'] = $_POST['group_id'];

        $group_id = $_POST['group_id'];
        $friendID = $_POST['friend_id'];
    } else {
        $response['info'] = 'no data sent';
    }

    if (!check_if_user_is_group_member($group_id, $current_user)) {
        wp_send_json_error('You are not a member of this group', 404);
    } else {
        if(!check_if_group_relation_exist($group_id, $current_user, $friendID)) {

            $wpdb->insert(
                'wptd_groups_members',
                array(
                    'group_id' => $group_id,
                    'main_user_id' => $current_user,
                    'target_user_id' => $friendID,
                    'status' => 2
                )
            );

            $wpdb->insert(
                'wptd_groups_members',
                array(
                    'group_id' => $group_id,
                    'main_user_id' => $friendID,
                    'target_user_id' => $current_user,
                    'status' => 3
                )
            );
        } else {
            $response['info'] = 'relacja już istnieje';
        }
    }
    
    wp_send_json($response);
}


add_action("wp_ajax_add_group", "add_group");
add_action("wp_ajax_nopriv_add_group", "add_group");

function add_group() {
    global $wpdb;

    $current_user = get_current_user_id();
    $current_datetime = date("Y-m-d H:i:s");

    if (isset($_POST['group_name'])) {
        if (check_current_user_group_quantity($current_user)) {
            $group_name = $_POST['group_name'];
            
            $response['group_name'] = $group_name;

            if ($group_name != '') {
                $wpdb->insert(
                'wptd_groups',
                array(
                    'name' => $group_name,
                    'owner' => $current_user,
                    'date_created' => $current_datetime
                    )
                );

                $current_insert_id = $wpdb->insert_id;
                add_group_member($current_insert_id, $current_user, 1);

                $response['info'] = 'dodano grupę o id ' . $current_insert_id; 

            } else {
               $response['info'] = 'Pole task nie może być puste!';
            } 
        } else {
            $response['info'] = check_current_user_group_quantity($current_user);    
        }
    } else {
        $response['info'] = 'Błąd formularza';
    }

    wp_send_json($response);
}


add_action("wp_ajax_delete_group", "delete_group");
add_action("wp_ajax_nopriv_delete_group", "delete_group");

function delete_group() {
    global $wpdb;
    $group_id = $_POST['group_id'];
    $current_user_id = get_current_user_id();

    $response['info'] = 'not deleted';
    if (check_if_user_is_group_owner($group_id, $current_user_id)) {
        $wpdb->delete(
        'wptd_groups',
        array(
            'id' => $group_id
            )
        );
        
        $wpdb->query( "DELETE FROM wptd_groups_members WHERE group_id = $group_id" );
            
        $response['info'] = 'deleted';
    }
    
    wp_send_json($response);
}


add_action("wp_ajax_show_current_user_groups", "show_current_user_groups");
add_action("wp_ajax_nopriv_show_current_user_groups", "show_current_user_groups");

function show_current_user_groups() {
    global $wpdb;
    $user_id = get_current_user_id();
    if ($user_id) {
        $response = $wpdb->get_results( "SELECT * FROM wptd_groups WHERE owner = $user_id" );
        $response = json_encode($response);
        wp_send_json($response);
    } else {
        return null;
    }
}


// get current user by id or nickname for future api access
function get_user_info($id) {
    global $wpdb;

    $response = $wpdb->get_row( "SELECT * FROM wptd_users WHERE id = $id" );
    return $response;
}


add_action("wp_ajax_find_user", "find_user");
add_action("wp_ajax_nopriv_find_user", "find_user");

function find_user() {
    global $wpdb;

    if (isset($_POST['name_to_find'])) {
        $name = $_POST['name_to_find'];
    }
    $response = $wpdb->get_results( "SELECT id, user_login FROM wptd_users WHERE user_login LIKE '%$name%' LIMIT 10" );

    $user_id = get_current_user_id();
    $current_user_data = get_user_info($user_id);

    foreach($response as $res) {
        if ($res->id == $current_user_data->ID) {
            $index = array_search($res, $response);
        }
    }
    unset($response[$index]);
    $response = json_encode($response);
    
    wp_send_json($response);
}


function check_users_relation($current_user_id, $invitedID) {
    global $wpdb;
    $result = $wpdb->get_row( "SELECT relation_status FROM wptd_users_relations WHERE main_user_id = $current_user_id AND target_user_id = $invitedID" );

    return $result->relation_status;
}


function get_user_id_by_user_name($user_name) {
    global $wpdb;

    $response = $wpdb->get_row( "SELECT id FROM wptd_users WHERE user_login = '$user_name'" );
    return $response;
}


add_action("wp_ajax_get_user_profile", "get_user_profile");
add_action("wp_ajax_nopriv_get_user_profile", "get_user_profile");

function get_user_profile() {
    global $wpdb;

    if (isset($_POST['user_id'])) {
        $target_user_id = $_POST['user_id'];
    }
    
    $current_user_id = get_current_user_id();

    $response = $wpdb->get_row( "SELECT id, user_login, user_registered, user_registered FROM wptd_users WHERE id = $target_user_id" );

    $users_relation = check_users_relation($current_user_id, $target_user_id);

    $response->me = $current_user_id;
    $response->him = $target_user_id;
    
    if (!$users_relation && $target_user_id != $current_user_id) {
        $button_html_code = <<<EOT
        <button class="btn btn-success btn-add-friend" event="click" action="add-friend" target-user-id="$response->id">Add friend</button>
        EOT;
    } else {
        switch ($users_relation) {
            case '1':
                $button_html_code = <<<EOT
                <button class="btn btn-danger btn-add-friend" event="click" action="remove-relation" target-user-id="$response->id">Remove friend</button>
                EOT;
                break;
            case '2':
                $button_html_code = <<<EOT
                <button class="btn btn-warning btn-add-friend" event="click" action="remove-relation" target-user-id="$response->id">Remove invitation</button>
                EOT;
                break;
            case '3':
                $button_html_code = <<<EOT
                <button class="btn btn-success btn-add-friend" event="click" action="accept-invitation" target-user-id="$response->id">Accept invitation</button>
                <button class="btn btn-danger btn-add-friend" event="click" action="remove-relation" target-user-id="$response->id">Reject invitation</button>
                EOT;
                break;
        }
     }

    $response->relation = $users_relation;
    $response->relation_type = gettype($users_relation);

    $response->btn_code = $button_html_code;
    $response = json_encode($response);
    
    wp_send_json($response);
}



add_action("wp_ajax_invite_friend", "invite_friend");
add_action("wp_ajax_nopriv_invite_friend", "invite_friend");

function invite_friend() {
    global $wpdb;

    $current_user_id = get_current_user_id();

    if (isset($_POST['invited_id'])) {
        $invitedID = $_POST['invited_id'];

        if (check_users_relation($current_user_id, $invitedID)) wp_send_json($response['error'] = 'You have relation with this user');
            
        $response['1'] = intval($current_user_id);
        $response['2'] = intval($invitedID);
        $response['3'] = get_current_date();

        $wpdb->insert(
            'wptd_users_relations',
            array(
                'main_user_id' => intval($current_user_id),
                'target_user_id' => intval($invitedID),
                'relation_status' => 2,
                'relation_date' => get_current_date(),
            ),
        );

        $wpdb->insert(
            'wptd_users_relations',
            array(
                'main_user_id' => intval($invitedID),
                'target_user_id' => intval($current_user_id),
                'relation_status' => 3,
                'relation_date' => get_current_date(),
            )
        );
    }

    wp_send_json($response);
}


add_action("wp_ajax_show_friends_relations", "show_friends_relations");
add_action("wp_ajax_nopriv_show_friends_relations", "show_friends_relations");

function show_friends_relations() {
    global $wpdb;

    $current_user_id = get_current_user_id();

    $results = $wpdb->get_results( "SELECT * FROM wptd_users_relations WHERE main_user_id = $current_user_id" );

    foreach($results as $result) {
        $user_data = get_user_info($result->target_user_id);
        $result->friend_name = $user_data->user_login; 
    }
    
    wp_send_json($results);
}


add_action("wp_ajax_show_friends", "show_friends");
add_action("wp_ajax_nopriv_show_friends", "show_friends");

function show_friends($type = null) {
    global $wpdb;

    $current_user_id = get_current_user_id();

    $result = $wpdb->get_results( "SELECT * FROM wptd_users_relations WHERE main_user_id = $current_user_id AND relation_status = 1" );
    if ($type) {
        return $result;
    } else {
        wp_send_json($result);
    }
}


add_action("wp_ajax_show_friends_not_in_group", "show_friends_not_in_group");
add_action("wp_ajax_nopriv_show_friends_not_in_group", "show_friends_not_in_group");

function show_friends_not_in_group() {
    global $wpdb;
    $current_user_id = get_current_user_id();
    $group_id = $_POST['group_id'];

    $is_user_group_owner = check_if_user_is_group_owner($group_id, $current_user_id);

    $friends_not_in_group = array(); 

    if ($is_user_group_owner == true) {
        $friends = show_friends('array');
        $friends_ids = array();
    
        foreach($friends as $friend) {
            array_push($friends_ids, $friend -> target_user_id);
        }

        foreach($friends_ids as $friend_id) {

            if (!check_if_user_is_group_member($group_id, $friend_id)) {
                $friend = get_user_info($friend_id);
                array_push($friends_not_in_group, array('id' => $friend -> ID, 'name' => $friend -> user_login));
            }
        }
    }

    wp_send_json($friends_not_in_group);
}


add_action("wp_ajax_accept_friend_invitation", "accept_friend_invitation");
add_action("wp_ajax_nopriv_accept_friend_invitation", "accept_friend_invitation");

function accept_friend_invitation() {
    global $wpdb;
    $current_user_id = get_current_user_id();

    $target_user_id = $_POST['target_id'];
    $results['id'] = $current_user_id;

    $wpdb->query("UPDATE wptd_users_relations SET relation_status = 1 WHERE main_user_id = $current_user_id AND target_user_id = $target_user_id OR main_user_id = $target_user_id AND target_user_id = $current_user_id");

    wp_send_json($results);
}


add_action("wp_ajax_remove_relation", "remove_relation");
add_action("wp_ajax_nopriv_remove_relation", "remove_relation");

function remove_relation() {
    global $wpdb;
    $current_user_id = get_current_user_id();

    $targetID = $_POST['target_id'];

    $results = $wpdb->get_results( "SELECT id FROM wptd_users_relations WHERE main_user_id = $current_user_id AND target_user_id = $targetID OR main_user_id = $targetID AND target_user_id = $current_user_id" );

    $ids_to_delete = array($results[0] -> id, $results[1] -> id);
    $ids_to_delete = join(',',$ids_to_delete);
     
    $wpdb->query( "DELETE FROM wptd_users_relations WHERE ID IN($ids_to_delete)" );

    wp_send_json($results);
}


function get_group_data($group_id) {
    global $wpdb;

    $response = $wpdb->get_row( "SELECT name, owner FROM wptd_groups WHERE id = $group_id" );

    return $response;
}


add_action("wp_ajax_show_groups_relations", "show_groups_relations");
add_action("wp_ajax_nopriv_show_groups_relations", "show_groups_relations");

function show_groups_relations() {
    global $wpdb;
    $user_id = get_current_user_id();
    if ($user_id) {
        $response = $wpdb->get_results( "SELECT * FROM wptd_groups_members WHERE main_user_id = $user_id" );
        foreach($response as $res) {
            $group_data = get_group_data($res->group_id);
            $owner_data = get_user_info($group_data->owner);
            $target_data = get_user_info($res->target_user_id);
            $owner_name = $owner_data->user_login;
            if($target_data) {
                $target_name = $target_data->user_login;
            }
            $group_name = $group_data->name;
            $group_owner = $group_data->owner;

            $res->name = $group_name;
            $res->owner = $group_owner;
            $res->owner_name = $owner_name;
            if($target_data) {
                $res->target_name = $target_name;
            }
        }
        
        wp_send_json($response);
    } else {
        return null;
    }
}


add_action("wp_ajax_accept_group_invitation", "accept_group_invitation");
add_action("wp_ajax_nopriv_accept_group_invitation", "accept_group_invitation");

function accept_group_invitation() {
    global $wpdb;
    $current_user_id = get_current_user_id();
    $group_id = $_POST['group_id'];
    $target_user_id = $_POST['target_user_id'];
    $rere = $wpdb->get_results("SELECT * FROM wpdt_groups_members WHERE group_id = $group_id AND main_user_id = $current_user_id AND target_user_id = $target_user_id OR group_id = $group_id AND main_user_id = $target_user_id AND target_user_id = $current_user_id");
    $wpdb->query("UPDATE wptd_groups_members SET status = 1 WHERE group_id = $group_id AND main_user_id = $current_user_id AND target_user_id = $target_user_id");
    $wpdb->query("DELETE FROM wptd_groups_members WHERE group_id = $group_id AND main_user_id = $target_user_id AND target_user_id = $current_user_id");
    $response['info'] = 'zaakceptowane';
    
    wp_send_json($response);
}


add_action("wp_ajax_remove_group_relation", "remove_group_relation");
add_action("wp_ajax_nopriv_remove_group_relation", "remove_group_relation");

function remove_group_relation() {
    global $wpdb;

    $main_user_id = strval(get_current_user_id());
    $group_id = $_POST['group_id'];
    $target_user_id = $_POST['target_user_id'];
    $res['a'] = $main_user_id;
    $res['b'] = $group_id;
    $res['c'] = $target_user_id;

    $results = $wpdb->get_results( "SELECT id FROM wptd_groups_members WHERE group_id = $group_id AND main_user_id = $main_user_id AND target_user_id = $target_user_id OR group_id = $group_id AND main_user_id = $target_user_id AND target_user_id = $main_user_id" );

    if ($results[1]){
        $ids_to_delete = array($results[0] -> id, $results[1] -> id);
        $ids_to_delete = join(',',$ids_to_delete);
    } else {
        $ids_to_delete = $results[0] -> id;
    }
    
    $wpdb->query( "DELETE FROM wptd_groups_members WHERE id IN($ids_to_delete)" );

    wp_send_json($res);
}


add_action("wp_ajax_leave_group", "leave_group");
add_action("wp_ajax_nopriv_leave_group", "leave_group");

function leave_group() {
    global $wpdb;

    $current_user = strval(get_current_user_id());
    $group_id = $_POST['group_id'];

    if (check_if_user_is_group_member($group_id, $current_user)) {
        $result = $wpdb->get_row( "SELECT id FROM wptd_groups_members WHERE group_id = $group_id AND main_user_id = $current_user" );
        $wpdb->query( "DELETE FROM wptd_groups_members WHERE id = $result->id");
        $response['success'] = 'deleted';
        $code = 403;
    } else {
        $response['error'] = 'something went wrong';
    }
    
    wp_send_json($response, $code);
}


add_action("wp_ajax_show_current_group_members", "show_current_group_members");
add_action("wp_ajax_nopriv_show_current_group_members", "show_current_group_members");

function show_current_group_members() {
    global $wpdb;

    $current_user_id = get_current_user_id();
    $group_id = $_POST['group_id'];

    $results['res'] = $current_user_id;
    $results = $wpdb->get_results( "SELECT main_user_id FROM wptd_groups_members WHERE group_id = $group_id AND main_user_id <> $current_user_id AND status = 1" );

    foreach($results as $result) {
        $user_data = get_user_info($result->main_user_id);
        $result->user_login = $user_data->user_login;
    }

    if (check_if_user_is_group_owner($group_id, $current_user_id)) {
        array_unshift($results, 'owner');
    } else {
        array_unshift($results, 'user');
    }

    wp_send_json($results);
}


add_action("wp_ajax_remove_group_member", "remove_group_member");
add_action("wp_ajax_nopriv_remove_group_member", "remove_group_member");

function remove_group_member() {
    global $wpdb;
    $current_user = get_current_user_id();
    $group_id = $_POST['group_id'];
    $target_user_id = $_POST['target_user_id'];

    $response['info'] = 'not deleted';

    if (check_if_user_is_group_owner($group_id, $current_user)) {
          $result = $wpdb->get_row( "SELECT id FROM wptd_groups_members WHERE group_id = $group_id AND main_user_id = $target_user_id AND status = 1" );
  
          $wpdb->delete(
            'wptd_groups_members',
            array(
                'ID' => $result->id,
            )
        );
    }
  
    wp_send_json($response);
}


function show_navbar() {
    if (is_user_logged_in()) {
        wp_nav_menu(array(
            'theme_location' => 'navbar-menu',
            'menu_id'        => 'navbar-menu',
            'menu_class'     => 'navbar navbar-menu-holder',
        ));
    }
}


function show_home_content() {
    if (is_user_logged_in()) {
        wp_nav_menu(array(
            'theme_location' => 'home-menu-logged',
            'menu_id'        => 'home-menu-logged',
            'menu_class'     => 'home-menu-holder',
        ));
    } else {
        wp_nav_menu(array(
            'theme_location' => 'home-menu-unlogged',
            'menu_id'        => 'home-menu-unlogged',
            'menu_class'     => 'home-menu-holder',
        ));
    }
}