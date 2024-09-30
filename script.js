window.addEventListener('DOMContentLoaded', () => {

    const listeners = {
        init() {
            listeners.loadListeners();
        },

        loadListeners() {
            document.addEventListener('click', this.clickListeners);
            document.body.classList.add('events-loaded');
            if (document.querySelector('.task-list')) {
                listeners.dragListeners();
            }
        },

        clickListeners(e) {
            const event = e.target.getAttribute('event');

            if (event == 'click') {
                const action = e.target.getAttribute('action');
                let userID = e.target.getAttribute('target-user-id');
                const groupID = e.target.getAttribute('group-relation-id');
                const taskCard = e.target.closest('.task-card');
                let taskID;
                if (taskCard) {
                    taskID = taskCard.getAttribute('data-id');
                }
                
                switch (action) {
                    case 'add-task':
                        task.addTask();
                        break;
                        
                    case 'remove-task':
                        task.removeTask(taskID);
                        break;

                    case 'add-group':
                        const taskNameInput = document.querySelector('.input-group-name');
                        group.createGroup(taskNameInput.value);
                        taskNameInput.value = '';
                        accordion.setHeight();
                        break;

                    case 'find-user':
                        const inputUserName = document.querySelector('.input-user-name');
                        user.findUser(inputUserName.value);
                        break;

                    case 'add-friend':
                        friend.addFriend(userID);
                        break;

                    case 'remove-relation':
                        friend.removeRelation(userID);
                        break;

                    case 'accept-invitation':
                        friend.acceptInvitation(userID);
                        break;

                    case 'invite-friend-to-group':
                        group.inviteFriendToGroup();
                        break;

                    case 'remove-group-relation':
                        group.removeGroupRelation(groupID, userID);
                        break;
                        
                    case 'leave-group':
                        group.leaveGroup(groupID);
                        break;

                    case 'accept-group-invitation':
                        group.acceptGroupInvitation(groupID, userID);
                        break;

                    case 'done-task':
                        task.doneTask(taskID);
                        break;

                    case 'undone-task':
                        task.undoneTask(taskID);
                        break;

                    case 'show-profile':
                        profile.showProfile(userID);
                        break;

                    case 'remove-group-member':
                        group.removeGroupMember(userID);
                        break;

                    case 'delete-group':
                        group.deleteGroup();
                        break;

                    case 'add-cookie':
                        cookies.accept();
                        break;

                    case 'show-group':
                        group.show(groupID);
                        break;

                }
        
                listeners.refreshListeners();
            }
        },


        drag: null,
        draggingElement: null,
        touchStartY: null,
        tasks: document.querySelectorAll('.task-card'),
        taskList: document.querySelector('.task-list'),

        onDragStart: function(event) {
            listeners.draggingElement = event.target.closest('.task-card');
            event.dataTransfer.setData('text/plain', null);
            setTimeout(() => {
                listeners.draggingElement.classList.add('dragging');
            }, 0);
        },
        
        onDragEnd: function(event) {
            listeners.draggingElement.classList.remove('dragging');
            listeners.draggingElement = null;
            task.changeOrder();
        },
        
        onDragOver: function(event) {
            event.preventDefault();
            const targetElement = event.target.closest('li');
            if (targetElement && targetElement !== listeners.draggingElement) {
                const draggingIndex = Array.from(listeners.taskList.children).indexOf(listeners.draggingElement);
                const targetIndex = Array.from(listeners.taskList.children).indexOf(targetElement);
                const isMovingUp = draggingIndex > targetIndex;
            
                let insertionPoint;
                if (isMovingUp) {
                    insertionPoint = targetElement;
                } else {
                    insertionPoint = targetElement.nextSibling;
                }
            
                listeners.taskList.insertBefore(listeners.draggingElement, insertionPoint);
            }
        },
    
        onTouchStart: function(event) {
            if (event.target.classList.contains('drag-handler')) {
                const touch = event.targetTouches[0];
                listeners.draggingElement = event.target.closest('.task-card');
                
                if (!listeners.draggingElement) return;
            
                touchStartY = touch.clientY;
            
                setTimeout(() => {
                    if (listeners.draggingElement) {
                        listeners.draggingElement.classList.add('dragging');
                    }
                }, 0);
            }
        },
        
        onTouchMove: function(event) {
            if (event.target.classList.contains('drag-handler')) {
                event.preventDefault();
                const touch = event.targetTouches[0];
                const offsetY = touch.clientY - touchStartY;
                
                const targetElement = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.task-card');
                
                if (targetElement && targetElement !== listeners.draggingElement && listeners.taskList.contains(targetElement)) {
                    let insertionPoint;
                    
                    if (offsetY > 0) {
                        insertionPoint = targetElement.nextSibling;
                        if (insertionPoint === listeners.draggingElement) {
                            insertionPoint = listeners.draggingElement.nextSibling;
                        }
                    } else {
                        insertionPoint = targetElement;
                    }
                    
                    listeners.taskList.insertBefore(listeners.draggingElement, insertionPoint);
                }
            }
        },
    
        onTouchEnd: function(event) {
            if (event.target.classList.contains('drag-handler')) {
                listeners.draggingElement.classList.remove('dragging');
                listeners.draggingElement = null;
                task.changeOrder();
            }
        },

        dragListeners() {
            listeners.taskList.addEventListener('dragstart', listeners.onDragStart);
            listeners.taskList.addEventListener('dragend', listeners.onDragEnd);
            listeners.taskList.addEventListener('dragover', listeners.onDragOver);
            listeners.taskList.addEventListener('touchstart', listeners.onTouchStart);
            listeners.taskList.addEventListener('touchmove', listeners.onTouchMove);
            listeners.taskList.addEventListener('touchend', listeners.onTouchEnd);
        },
        
        refreshListeners() {
            document.removeEventListener('click', this.clickListeners);
            if(this.taskList) {
                this.taskList.removeEventListener('dragstart', listeners.onDragStart);
                this.taskList.removeEventListener('dragend', listeners.onDragEnd);
                this.taskList.removeEventListener('dragover', listeners.onDragOver);
                this.taskList.removeEventListener('touchstart', listeners.onTouchStart);
                this.taskList.removeEventListener('touchmove', listeners.onTouchMove);
                this.taskList.removeEventListener('touchend', listeners.onTouchEnd);
            }
            this.loadListeners();
        }
    }



    const card = {

        createGroupCards(groups) {
            const groupsHolder = document.querySelector('.group-list');

            groupsHolder.innerHTML = '';
            groups.forEach(element => {
                const groupCard = document.createElement('li');

                const groupCardInner = document.createElement('a');
                const groupCardTitle = document.createElement('p');
    
                groupCard.classList.add('card');
                groupCard.classList.add('group-card');
                groupCard.setAttribute('data-id', element.id);
                groupCardInner.setAttribute('href', `${window.location.origin}/group/?id=${element.id}`)

                groupCardTitle.classList.add('group-card-title');
                groupCardTitle.innerText = element.name;

                groupCardInner.appendChild(groupCardTitle);

                groupCard.appendChild(groupCardInner);
                groupsHolder.appendChild(groupCard);
            });
        },

        createGroupsRelationCards(groups) {
            let myGroupsList = document.querySelector('.my-groups-list');
            let invitedByMe = document.querySelector('.invited-by-me-to-groups');
            let invitedMeList = document.querySelector('.invited-me-to-groups');

            myGroupsList.innerHTML = '';
            invitedByMe.innerHTML = '';
            invitedMeList.innerHTML = '';

            groups.forEach(group => {
                const groupCard = document.createElement('li');
                const groupCardInner = document.createElement('div');
                const groupCardTitle = document.createElement('a');
                const groupCardTargetUser = document.createElement('a');
                const groupCardBtn = document.createElement('button');

                groupCard.classList.add('card');
                groupCard.classList.add('group-card');
                groupCardInner.classList.add('card-inner');
                groupCardBtn.setAttribute('group-relation-id', group.group_id);
                groupCardBtn.setAttribute('target-user-id', group.target_user_id);
                groupCardTargetUser.setAttribute('href', `/profile/?id=${group.target_user_id}`)
                groupCardTitle.setAttribute('href', `${window.location.origin}/group?id=${group.group_id}`)

                groupCardTitle.classList.add('group-card-title');
                groupCardTitle.innerText = group.name;
                groupCardTargetUser.classList.add('group-card-user');

                if(!group.target_name) {
                    groupCardTargetUser.innerText = 'owner: You';
                    groupCardTargetUser.setAttribute('href', '#');
                }
                groupCardInner.appendChild(groupCardTitle);
                groupCardInner.appendChild(groupCardTargetUser);
                groupCard.appendChild(groupCardInner);

                switch(group.status) {
                    case '1':
                        groupCardBtn.classList.add('btn');
                        groupCardBtn.innerText = 'Show';
                        groupCardBtn.setAttribute('event', 'click');
                        groupCardBtn.setAttribute('action', 'show-group');
                        groupCardInner.appendChild(groupCardBtn);
                        myGroupsList.appendChild(groupCard);
                        break;
                    case '2':
                        groupCardBtn.setAttribute('event', 'click');
                        groupCardBtn.setAttribute('action', 'remove-group-relation');
                        groupCardBtn.classList.add('btn');
                        groupCardBtn.classList.add('btn-warning');
                        groupCardBtn.innerText = 'Remove invitation';

                        groupCardTargetUser.innerText = `invited user: ${group.target_name}`;


                        groupCardInner.appendChild(groupCardBtn);
                        invitedByMe.appendChild(groupCard);
                         break;
                    case '3':
                        const groupCardRejectBtn = document.createElement('button');
                        groupCardBtn.setAttribute('event', 'click');
                        groupCardBtn.setAttribute('action', 'accept-group-invitation');

                        groupCardBtn.innerText = 'Accept invitation';
                        groupCardBtn.classList.add('btn');
                        groupCardBtn.classList.add('btn-success');

                        groupCardRejectBtn.setAttribute('event', 'click');
                        groupCardRejectBtn.setAttribute('action', 'remove-group-relation');
                        groupCardRejectBtn.classList.add('btn');
                        groupCardRejectBtn.classList.add('btn-danger');
                        groupCardRejectBtn.innerText = 'Reject invitation';

                        groupCardTargetUser.innerText = `invited by: ${group.target_name}`;


                        groupCardInner.appendChild(groupCardBtn);
                        groupCardInner.appendChild(groupCardRejectBtn);

                        invitedMeList.appendChild(groupCard);
                        break;
                  }
            })
        },

        createGroupsMembersCards(members) {
            const groupMembersHolder = document.querySelector('.group-members-holder');

            groupMembersHolder.innerHTML = '';
            const permissions = members[0];
            delete members[0];


            members.forEach(member => {
                const groupMemberCard = document.createElement('li');
                const groupMemberCardInner = document.createElement('div');
                const groupMemberBtnHolder = document.createElement('div');
                const groupMemberCardsShowMember = document.createElement('a');
                const groupMemberCardTitle = document.createElement('p');


                groupMemberCard.classList.add('card');
                groupMemberCard.classList.add('group-card');

                groupMemberCardInner.classList.add('card-inner')

                groupMemberBtnHolder.classList.add('btn-holder')
                
                groupMemberCardsShowMember.classList.add('btn');
                groupMemberCardsShowMember.classList.add('btn-info');
                groupMemberCardsShowMember.classList.add('btn-user-show-profile');
                groupMemberCardsShowMember.setAttribute('target-user-id', member.main_user_id);
                groupMemberCardsShowMember.setAttribute('href', `${window.location.origin}/profile/?id=${member.main_user_id}/`);

                groupMemberCardsShowMember.innerText = 'Profile';

                groupMemberCardTitle.classList.add('group-card-title');
                groupMemberCardTitle.innerText = member.user_login;


                groupMemberBtnHolder.appendChild(groupMemberCardsShowMember);
                groupMemberCardInner.appendChild(groupMemberCardTitle);


                if (permissions == 'owner') {
                    const groupMemberCardBtnRemove = document.createElement('button');

                    groupMemberCardBtnRemove.setAttribute('event', 'click');
                    groupMemberCardBtnRemove.setAttribute('action', 'remove-group-member');
                    groupMemberCardBtnRemove.classList.add('btn');
                    groupMemberCardBtnRemove.classList.add('btn-remove-group-member');
                    groupMemberCardBtnRemove.setAttribute('target-user-id', member.main_user_id);
                    groupMemberCardBtnRemove.innerText = 'Remove';


                    groupMemberBtnHolder.appendChild(groupMemberCardBtnRemove);
                }

                groupMemberCardInner.appendChild(groupMemberBtnHolder);
                groupMemberCard.appendChild(groupMemberCardInner);
                groupMembersHolder.appendChild(groupMemberCard);
            });
        },


        createTaskCards(tasks) {
            const tasksHolder = document.querySelector('.task-list');

            tasksHolder.innerHTML = '';

            tasks.forEach(element => {
                const taskCard = document.createElement('li');
                const dragHandler = document.createElement('div');
                const dragHandlerDot = document.createElement('div');
                const taskCardTitle = document.createElement('p');
                const taskBtnsHolder = document.createElement('div');
                const taskDoneBtn = document.createElement('button');
                const taskRemoveBtn = document.createElement('button');
    
                taskCard.classList.add('task-card');
                taskCard.setAttribute('data-id', element.id);
                taskCard.setAttribute('draggable', 'true');
              
                dragHandler.classList.add('drag-handler');
                dragHandlerDot.classList.add('drag-handler-dot');
                for (let i = 0; i < 8; i++) {
                    dragHandler.appendChild(dragHandlerDot.cloneNode(true));
                }

                taskCardTitle.classList.add('task-card-title');
                taskCardTitle.innerText = element.name;

                taskBtnsHolder.classList.add('task-card-btns-holder');
                taskDoneBtn.classList.add('done-task-btn');
                taskDoneBtn.classList.add('btn-success');
                taskDoneBtn.classList.add('btn');
                taskDoneBtn.setAttribute('event', 'click');

                if (element.done == 1) {
                    taskCard.classList.add('task-done');
                    taskDoneBtn.setAttribute('action', 'undone-task');
                    taskDoneBtn.innerText = 'undone';
                } else {
                    taskDoneBtn.setAttribute('action', 'done-task');
                    taskDoneBtn.innerText = 'done';
                }
          
                taskRemoveBtn.classList.add('remove-task-btn');
                taskRemoveBtn.classList.add('btn-outline-danger');
                taskRemoveBtn.classList.add('btn');
                taskRemoveBtn.setAttribute('event', 'click');
                taskRemoveBtn.setAttribute('action', 'remove-task');
                taskRemoveBtn.innerText = 'remove';
    
                taskCard.appendChild(dragHandler);
                taskCard.appendChild(taskCardTitle);
                taskBtnsHolder.appendChild(taskDoneBtn);
                taskBtnsHolder.appendChild(taskRemoveBtn);
                taskCard.appendChild(taskBtnsHolder);
                tasksHolder.appendChild(taskCard);
            });
        },


        createUserCards(users) {
            const usersList = document.querySelector('.users-list');

            usersList.innerHTML = '';
            users.forEach(user => {
                const userCard = document.createElement('li');
                const userCardAnchor = document.createElement('a');
                const userCardTitle = document.createElement('p');
                const userProfileBtn = document.createElement('button');
                userProfileBtn.innerText = 'Profile';
                userProfileBtn.classList.add('btn');

                userCard.classList.add('card');
                userCard.classList.add('user-card');
                userCard.setAttribute('data-id', user.id);
                userCard.setAttribute('draggable', 'true');
                
                userCardAnchor.classList.add('card-inner');
                userCardAnchor.setAttribute('href', `/profile/?id=${user.id}`)

                userCardTitle.classList.add('card-title');
                userCardTitle.innerText = user.user_login;
                
                userCardAnchor.appendChild(userCardTitle);
                userCardAnchor.appendChild(userProfileBtn);
                // userBtnsHolder.appendChild(userRemoveBtn);
                // userCard.appendChild(userBtnsHolder);
                userCard.appendChild(userCardAnchor);
                usersList.appendChild(userCard);
            });
        },


        createFriendsCards(friends) {
            const myFriendsList = document.querySelector('.my-friends-list');
            const invitedUsersList = document.querySelector('.invited-users-list');
            const invitedMeList = document.querySelector('.invited-me-list');

            myFriendsList.innerHTML = '';
            invitedUsersList.innerHTML = '';
            invitedMeList.innerHTML = '';
            friends.forEach(friend => {
                const friendCard = document.createElement('li');
                const friendCardInner = document.createElement('div');
                const friendCardAnchor = document.createElement('a');
                const friendCardTitle = document.createElement('p');
                const friendCardBtn = document.createElement('button');
                friendCardBtn.setAttribute('target-user-id', friend.target_user_id);
                friendCardAnchor.setAttribute('href', `/profile/?id=${friend.target_user_id}`)
                friendCardTitle.classList.add('friend-card-title');
                friendCardTitle.innerText = friend.friend_name;
                friendCardAnchor.appendChild(friendCardTitle);
                // friendCard.appendChild(friendCardAnchor);
                friendCardInner.appendChild(friendCardAnchor);
                friendCard.classList.add('card');
                friendCard.classList.add('friend-card');
                friendCardInner.classList.add('card-inner')
                friendCardBtn.classList.add('btn');

                switch(friend.relation_status) {
                    case '1':
                        friendCardBtn.setAttribute('event', 'click');
                        friendCardBtn.setAttribute('action', 'remove-relation');
                        friendCardBtn.innerText = 'Remove friend';
                        friendCardBtn.classList.add('btn');
                        friendCardBtn.classList.add('btn-danger');
                        friendCardInner.appendChild(friendCardBtn);
                        friendCard.appendChild(friendCardInner);
                        myFriendsList.appendChild(friendCard);
                        break;
                    case '2':
                        friendCardBtn.setAttribute('event', 'click');
                        friendCardBtn.setAttribute('action', 'remove-relation');
                        friendCardBtn.innerText = 'Remove invitation';
                        friendCardBtn.classList.add('btn');
                        friendCardBtn.classList.add('btn-warning');
                        friendCardInner.appendChild(friendCardBtn);
                        friendCard.appendChild(friendCardInner);
                        invitedUsersList.appendChild(friendCard);
                         break;
                    case '3':
                        const friendCardRejectBtn = document.createElement('button');
                        friendCardBtn.setAttribute('event', 'click');
                        friendCardBtn.setAttribute('action', 'accept-invitation');
                        friendCardBtn.innerText = 'Accept invitation';

                        friendCardRejectBtn.setAttribute('event', 'click');
                        friendCardRejectBtn.setAttribute('action', 'remove-relation');
                        friendCardRejectBtn.classList.add('btn');
                        friendCardRejectBtn.classList.add('btn-danger');

                        friendCardRejectBtn.innerText = 'Reject invitation';

                        friendCardInner.appendChild(friendCardBtn);
                        friendCardInner.appendChild(friendCardRejectBtn);

                        friendCard.appendChild(friendCardInner);

                        invitedMeList.appendChild(friendCard);
                        break;
                  }
            })
        },


        removeTaskCards() {
            if(document.querySelector('.tasks-holder')) {
                document.querySelector('.tasks-holder').innerHTML = '';
            }
        }
    }



    const selectList = {
        createFriendsList(friends) {
            let myFriendsOptionListHolder = document.querySelector('.invite-friends-to-group-holder');
            if (myFriendsOptionListHolder) {

                myFriendsOptionListHolder.innerHTML = '';
            
                let myFriendsOptionList = document.querySelector('.my-friends-option-list');

                let btnInviteFriendToGroup = document.querySelector('.btn-invite-friend-to-group');
                
                if(myFriendsOptionList){
                    myFriendsOptionList.removeChild(myFriendsOptionList);
                    myFriendsOptionList.removeChild(btnInviteFriendToGroup);
                } else {
                    myFriendsOptionList = document.createElement('select');
                    myFriendsOptionList.classList.add('my-friends-option-list');
                    btnInviteFriendToGroup = document.createElement('button');
                    btnInviteFriendToGroup.classList.add('btn');
                    btnInviteFriendToGroup.classList.add('btn-success');
                    btnInviteFriendToGroup.classList.add('btn-invite-friend-to-group');
                    btnInviteFriendToGroup.setAttribute('action','invite-friend-to-group');
                    btnInviteFriendToGroup.setAttribute('event','click');
                    btnInviteFriendToGroup.innerText = 'Invite to group';
                }

                friends.forEach(friend => {
                    const friendOption = document.createElement('option');
                    friendOption.setAttribute('value', friend.id);
                    friendOption.innerText = friend.name;
                    myFriendsOptionList.appendChild(friendOption);
                });

                myFriendsOptionListHolder.appendChild(myFriendsOptionList);
                myFriendsOptionListHolder.appendChild(btnInviteFriendToGroup);
            }
        }
    }
 

    
    const task = {

        init() {
            if (document.querySelector('.task-list')) {
                task.showTasks();
            }
        },


       removeTask(taskID) {
            const idToRemove = taskID;

            fetch('/wp-admin/admin-ajax.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: "remove_task",
                    id: idToRemove,
                })
            })
            .then(response => response.json())
            .then(data => {
                task.showTasks();
            })
            .catch(error => {
                console.error('Error:', error);
            });

        },


        showTasks() {
            const matches = /id=([^&#=]*)/.exec(window.location.search);
            if(!matches) {
                return;
            } 
            const groupID = matches[1];

            fetch('/wp-admin/admin-ajax.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: "show_tasks",
                    group_id: groupID,
                })
            })
            .then(response => response.json())
            .then(data => {
                card.removeTaskCards();
                let objs = JSON.parse(data);
                card.createTaskCards(objs);
                listeners.loadListeners();
                listeners.refreshListeners();
                // document.querySelector('.loading-overlay').classList.remove('active');
            })
            .catch(error => {
                console.error('Error:', error);
            });
        },


        addTask() {
            const matches = /id=([^&#=]*)/.exec(window.location.search);
            const groupID = matches[1];
            const name = document.querySelector('.input-task-name').value;


            fetch('/wp-admin/admin-ajax.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: "add_task",
                    task_name: name,
                    group_id: groupID
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.max == true) {
                    alert('You reached tasks limit 15 tasks in this group. Remove some tasks.')
                }
                task.showTasks();
            })
            .catch(error => {
                console.error('Error:', error);
            });
        },


        changeOrder() {
            let elements = document.querySelectorAll('.task-card');

            elements.forEach(function(value, i) {
                let orderNumber = i;
                let taskID = value.getAttribute('data-id');


                fetch('/wp-admin/admin-ajax.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        action: "order_update",
                        id: taskID,
                        task_order: orderNumber,
                    })
                })
                .then(response => response.json())
                .catch(error => {
                    console.error('Error:', error);
                });
            });
        },


        doneTask(id) {
            fetch('/wp-admin/admin-ajax.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: "done_task",
                    id: id
                })
            })
            .then(response => response.json())
            .then(data => {
                task.showTasks();
            })
            .catch(error => {
                console.error('Error:', error);
            });
        },


        undoneTask(id) {
            fetch('/wp-admin/admin-ajax.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: "undone_task",
                    id: id
                })
            })
            .then(response => response.json())
            .then(data => {
                task.showTasks();
            })
            .catch(error => {
                console.error('Error:', error);
            });
        }
    }



    const group = {
        init() {
            if (document.querySelector('.group-members-holder')) {
                group.showGroupMembers();
                group.checkIfUserIsGroupMember();
            }

            if (document.querySelector('.my-groups-list')) {
                group.showGroupsRelations(true);
            }
        },

        show(groupID) {
            window.location.href = `/group/?id=${groupID}`;
        },


        checkIfUserIsGroupMember() {
            const matches = /id=([^&#=]*)/.exec(window.location.search);
            const groupID = matches[1];

            fetch('/wp-admin/admin-ajax.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: "check_user_in_group",
                    group_id: groupID
                })
            })
            .then(response => {
                if (response.status != 200) {
                    window.location.href = '/groups/';
                }
            })
            .then(data => {
                
            })
            .catch(error => {
                console.error('Error:', error);
            });
        },


        showGroupsRelations() {
            fetch('/wp-admin/admin-ajax.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: "show_groups_relations"
                })
            })
            .then(response => response.json())
            .then(data => {
                card.createGroupsRelationCards(data);

                // document.querySelector('.loading-overlay').classList.remove('active');
            })
            .catch(error => {
                console.error('Error:', error);
            });
        },


        showGroupMembers() {
            const matches = /id=([^&#=]*)/.exec(window.location.search);
            const groupID = matches[1];

            fetch('/wp-admin/admin-ajax.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: "show_current_group_members",
                    group_id: groupID
                })
            })
            .then(response => response.json())
            .then(data => {
                card.createGroupsMembersCards(data);
                document.querySelector('.loading-overlay').classList.remove('active');
            })
            .catch(error => {
                console.error('Error:', error);
            });
        },

        
        createGroup(name) {
            fetch('/wp-admin/admin-ajax.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: "add_group",
                    group_name: name,
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.info == false) {
                    alert('You reached limit 3 groups');
                }
                group.showGroupsRelations();
            })
            .catch(error => {
                console.error('Error:', error);
            });
        },


        deleteGroup() {
            const matches = /id=([^&#=]*)/.exec(window.location.search);
            if(!matches) return;
            const groupID = matches[1];

            fetch('/wp-admin/admin-ajax.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: "delete_group",
                    group_id: groupID,
                })
            })
            .then(response => response.json())
            .then(data => {
            })
            .catch(error => {
                console.error('Error:', error);
            });
        },


        inviteFriendToGroup() {
            const friendsList = document.querySelector('.my-friends-option-list');
            const friendID = friendsList.value;
            const matches = /id=([^&#=]*)/.exec(window.location.search);
            const groupID = matches[1];
            

            fetch('/wp-admin/admin-ajax.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: "invite_friend_to_group",
                    friend_id: friendID,
                    group_id: groupID
                })
            })
            .then(response => response.json())
            .then(data => {
                friend.showFriendsNotInGroup()
            })
            .catch(error => {
                console.error('Error:', error);
            });
        },


        removeGroupMember(targetUserID) {
            const matches = /id=([^&#=]*)/.exec(window.location.search);
            if(!matches) return;

            const groupID = matches[1];


            fetch('/wp-admin/admin-ajax.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: "remove_group_member",
                    group_id: groupID,
                    target_user_id: targetUserID
                })
            })
            .then(response => response.json())
            .then(data => {
                group.showGroupMembers();
            })
            .catch(error => {
                console.error('Error:', error);
            });
        },


        acceptGroupInvitation(groupID, targetUserID) {

            fetch('/wp-admin/admin-ajax.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: "accept_group_invitation",
                    group_id: groupID,
                    target_user_id: targetUserID
                })
            })
            .then(response => response.json())
            .then(data => {
                group.showGroupsRelations();
            })
            .catch(error => {
                console.error('Error:', error);
            });
        },


        removeGroupRelation(groupID, targetUserID) {
            fetch('/wp-admin/admin-ajax.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: "remove_group_relation",
                    group_id: groupID,
                    target_user_id: targetUserID
                })
            })
            .then(response => response.json())
            .then(data => {
                group.showGroupsRelations();
            })
            .catch(error => {
                console.error('Error:', error);
            });
        },


        leaveGroup(groupID) {
            fetch('/wp-admin/admin-ajax.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: "leave_group",
                    group_id: groupID,
                })
            })
            .then(response => {
                if (response.status == 403) {
                    window.location.href = '/groups/';
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        }
    }



    const user = {
        findUser(username) {
            if (username != '') {

                fetch('/wp-admin/admin-ajax.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        action: 'find_user',
                        name_to_find: username,
                    })
                })
                .then(response => response.json())
                .then(data => {
                    let users = JSON.parse(data);
                        user.showUsers(users);
                })
                .catch(error => {
                    console.error('Error:', error);
                });
            }
        },


        showUsers(users) {
            const usersList = Object.values(users)
            card.createUserCards(usersList);
        },
    }



    const friend = {
        myFirendsList: document.querySelector('.my-friends-list'),
        invitedUsersList: document.querySelector('.invited-users-list'),
        invitedMeList: document.querySelector('.invited-me-list'),
        pageGroup: document.querySelector('.page-group'),

        init() {
            if (friend.myFirendsList && friend.invitedUsersList && friend.invitedMeList) {
                friend.showFriendsRelations(true);
            }
            
            if (friend.myFirendsList && !friend.invitedUsersList && !friend.invitedMeList) {
                friend.showFriends(true);
            }
            
            if (friend.pageGroup) {
                friend.showFriendsNotInGroup(true);
            }
        },


        showFriendsNotInGroup() {
            const matches = /id=([^&#=]*)/.exec(window.location.search);
            if(!matches) {
                return;
            } 
            const groupID = matches[1];

            fetch('/wp-admin/admin-ajax.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: "show_friends_not_in_group",
                    group_id: groupID,
                })
            })
            .then(response => response.json())
            .then(data => {
                selectList.createFriendsList(data);
                // document.querySelector('.loading-overlay').classList.remove('active');
            })
            .catch(error => {
                console.error('Error:', error);
            });
        },


        showFriendsRelations() {
            if (this.myFirendsList && this.invitedUsersList && this.invitedMeList) {
                fetch('/wp-admin/admin-ajax.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        action: "show_friends_relations"
                    })
                })
                .then(response => response.json())
                .then(data => {
                    card.createFriendsCards(data);
                    // document.querySelector('.loading-overlay').classList.remove('active');
                })
                .catch(error => {
                    console.error('Error:', error);
                });
            }
        },


        showFriends() {
            fetch('/wp-admin/admin-ajax.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: "show_friends"
                })
            })
            .then(response => response.json())
            .then(data => {
                card.createFriendsCards(data);
                // document.querySelector('.loading-overlay').classList.remove('active');
            })
            .catch(error => {
                console.error('Error:', error);
            });
        },


        addFriend(targetUserID) {
            fetch('/wp-admin/admin-ajax.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: "invite_friend",
                    invited_id: targetUserID
                })
            })
            .then(response => response.json())
            .then(data => {
                profile.getProfile(profile.getProfileId());
            })
            .catch(error => {
                console.error('Error:', error);
            });
        },


        acceptInvitation(targetAcceptUserID) {
            fetch('/wp-admin/admin-ajax.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: "accept_friend_invitation",
                    target_id: targetAcceptUserID
                })
            })
            .then(response => response.json())
            .then(data => {
                friend.showFriendsRelations();
            })
            .catch(error => {
                console.error('Error:', error);
            });
        },


        removeRelation(targetRemoveUserID) {
            fetch('/wp-admin/admin-ajax.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: "remove_relation",
                    target_id: targetRemoveUserID
                })
            })
            .then(response => response.json())
            .then(data => {
                profile.getProfile(profile.getProfileId());
                friend.showFriendsRelations();
            })
            .catch(error => {
                console.error('Error:', error);
            });
        }
    }



    const profile = {
        init() {
            profile.getProfile(profile.getProfileId());
        },


        showProfile(userID) {
            const profileURL = `${window.location.origin}/profile/?id=${userID}/`;
            window.location.href = profileURL;
        },


        getProfile(userID) {
            if(document.querySelector('.user-profile-holder')) {


                fetch('/wp-admin/admin-ajax.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        action: "get_user_profile",
                        user_id: userID,
                    })
                })
                .then(response => response.json())
                .then(data => {
                    let profileData = JSON.parse(data);
                    profile.createProfile(profileData);
                })
                .catch(error => {
                    console.error('Error:', error);
                });
            }
        },

        getProfileId() {
            const queryString = window.location.search;
            const urlParams = new URLSearchParams(queryString);
            const userId = urlParams.get('id'); // "shirt"
           
            if(userId) {
                return userId;
            } else {
                return 'error';
            }

        },


        createProfile(profileData) {
            let profileHolder = document.querySelector('.user-profile-holder');
            profileHolder.innerHTML = '';

            let userNameHolder = document.createElement('p')
            let userRegistrationDateHolder = document.createElement('p')
            userNameHolder.classList.add('user-name-holder')
            userRegistrationDateHolder.classList.add('user-registration-date-holder')
            userNameHolder.innerText = profileData.user_login;
            userRegistrationDateHolder.innerText = `Registered: ${profileData.user_registered}`;
            const btnHolder = document.createElement('div');
            btnHolder.innerHTML = profileData.btn_code;
            profileHolder.appendChild(userNameHolder);
            profileHolder.appendChild(userRegistrationDateHolder);
            profileHolder.appendChild(btnHolder);
        }
    }


    
    const accordion = {
        init() {
            const accordions = document.querySelectorAll('.accordion');
            if(accordions) {
                accordion.toggle(accordions);
                accordions.forEach(accordion => {
                    const accordionHeader = accordion.querySelector('.accordion-header');
                    const arrowHolder = document.createElement('div');
                    arrowHolder.classList.add('arrow-holder');
                    accordionHeader.appendChild(arrowHolder);
                });
                accordion.setHeight();

            }
        },

        setHeight() {
            setTimeout(() => {
                const myGroupsHeader = document.querySelector('.my-groups .accordion-header');
                const myGroupsBody = document.querySelector('.my-groups .accordion-body');
                const myGroupsList = document.querySelector('.my-groups-list');
                const addGroupsHeader = document.querySelector('.add-group .accordion-header');
                const addGroupsBody = document.querySelector('.add-group .accordion-body');
                
                if (myGroupsHeader && myGroupsBody) {
                    if (myGroupsList.hasChildNodes()) {
                        myGroupsHeader.classList.add('accordion-expanded');
                        myGroupsBody.classList.add('show');
                        myGroupsBody.style.maxHeight = myGroupsBody.scrollHeight + 'px';
                    } else {
                        addGroupsHeader.classList.add('accordion-expanded');
                        addGroupsBody.classList.add('show');
                        console
                        if (window.innerWidth > 801) {
                            addGroupsBody.style.maxHeight = myGroupsList.scrollHeight + 'px';
                        } else {
                            addGroupsBody.style.maxHeight = addGroupsBody.scrollHeight + 'px';
                        }
                    }
                }
            }, 500);
        },

        
        toggle(accordions) {
            // const accordions = document.querySelectorAll('.accordion');
            accordions.forEach(accordion => {
                const accordionHeader = accordion.querySelector('.accordion-header');
                const accordionBody = accordion.querySelector('.accordion-body');

                accordionHeader.addEventListener('click', () => {
                    accordionHeader.classList.toggle('accordion-expanded');
                    accordionBody.classList.toggle('show');
                    
                    if (accordionBody.classList.contains('show')) {
                        accordionBody.style.maxHeight = accordionBody.scrollHeight + 'px';
                    } else {
                        accordionBody.style.maxHeight = null;
                    }
                })
            })
        }
    }



    const menu = {
        init() {
            const menuTrigger = document.querySelector('.navbar-trigger');
            const menuContainer = document.querySelector('.menu-navbar-menu-container');
            const menuHolder = document.querySelector('.navbar-menu-holder');

            if(menuTrigger) {
                menuTrigger.addEventListener('click', () => {
                    menuTrigger.classList.toggle('active');
                    menuContainer.classList.toggle('active');
                });
            }
        
            document.addEventListener('click', e => {
                if (e.target != menuContainer && e.target != menuTrigger && e.target != menuHolder) {
                    if (menuContainer) {
                        if (menuContainer.classList.contains('active')) {
                            menuTrigger.classList.toggle('active');
                            menuContainer.classList.toggle('active');
                        }
                    }
                } 
             });
        }
    }


    
    const cookies = {
        body: document.body,

        init() {

            // check if cookie exist - if no display bar else no

            if (!this.getCookie('cookies_acc')) {
                const cookiesBanner = document.createElement('div');
                const cookiesText = document.createElement('p');
                const cookiesButton = document.createElement('button');
                
                cookiesBanner.classList.add('cookies-banner');
                cookiesText.classList.add('cookies-text');
                cookiesButton.classList.add('cookies-btn');
                cookiesButton.setAttribute('event', 'click');
                cookiesButton.setAttribute('action', 'add-cookie');
                
                cookiesText.innerHTML = "<b>This website uses cookies to ensure its proper functionality:</b><br /><br /><b>Necessary Cookies:</b> These cookies are essential for the website to function, such as enabling security, managing user sessions, and ensuring smooth navigation.<br /><b>Functional Cookies:</b> Used to remember your preferences and settings, such as language or login details.";
                cookiesButton.innerText = "I understand";
                
                
                cookiesBanner.appendChild(cookiesText);
                cookiesBanner.appendChild(cookiesButton);
                
                this.body.appendChild(cookiesBanner)
            }
        },

        getCookie(name) {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(';').shift();
        },

        setCookie(name, value) {
            var date = new Date();
            date.setMonth(date.getMonth() + 1); // Set the expiration date to one month from now
            var expires = "expires=" + date.toUTCString();
            document.cookie = name + "=" + value + ";" + expires + ";path=/";
        },

        accept() {
            this.setCookie('cookies_acc', '1');
            document.querySelector('.cookies-banner').style.display = 'none';
        }
    }



    const policy = {
        policy: null,
        init() {
            this.policy = document.querySelector('#accept_privacy_policy_row .uwp_message_note');
            if (this.policy) {
                this.policy.innerHTML = 'I accept the <a href="./privacy-policy/">Terms & Conditions</a>.';
            }
        }
    }


    window.addEventListener('load', () => {
        policy.init();
        cookies.init();
        profile.init();
        friend.init();
        listeners.init();
        group.init();
        accordion.init();
        menu.init();
        task.init();
    })
});