"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_service_1 = require("../services/user.service");
class UserController {
    static async getAll(req, res) {
        try {
            const users = await user_service_1.UserService.getAllUsers();
            res.json(users);
        }
        catch (error) {
            console.error('Error in UserController.getAll:', error);
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    }
    static async create(req, res) {
        try {
            const currentUserId = req.user?.id;
            if (!currentUserId)
                return res.status(401).json({ error: 'Unauthorized' });
            const { name, email, role, pin } = req.body;
            if (!name || !email || !role || !pin) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            const newUser = await user_service_1.UserService.createUser(req.body, currentUserId);
            res.status(201).json(newUser);
        }
        catch (error) {
            console.error('Error in UserController.create:', error);
            res.status(500).json({ error: 'Failed to create user' });
        }
    }
    static async update(req, res) {
        try {
            const id = req.params.id;
            const currentUserId = req.user?.id;
            if (!currentUserId)
                return res.status(401).json({ error: 'Unauthorized' });
            const updatedUser = await user_service_1.UserService.updateUser(id, req.body, currentUserId);
            if (!updatedUser)
                return res.status(404).json({ error: 'User not found' });
            res.json(updatedUser);
        }
        catch (error) {
            console.error('Error in UserController.update:', error);
            res.status(500).json({ error: 'Failed to update user' });
        }
    }
    static async delete(req, res) {
        try {
            const id = req.params.id;
            const currentUserId = req.user?.id;
            if (!currentUserId)
                return res.status(401).json({ error: 'Unauthorized' });
            const deletedUser = await user_service_1.UserService.deleteUser(id, currentUserId);
            if (!deletedUser)
                return res.status(404).json({ error: 'User not found' });
            res.json({ message: 'User deleted successfully', user: deletedUser });
        }
        catch (error) {
            console.error('Error in UserController.delete:', error);
            res.status(500).json({ error: 'Failed to delete user' });
        }
    }
}
exports.UserController = UserController;
