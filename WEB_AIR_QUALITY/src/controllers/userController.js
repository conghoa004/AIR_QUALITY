import User from '../models/UserModel.js';
import { generatePassword, validateUser, hashPassword, formatName, blockUser, updateSession } from '../utils/userHelper.js';

export default {
    // Hiển thị trang quản lý tài khoản
    renderUserManager: async (req, res) => {
        // Lấy danh sách user từ DB
        try {
            const users = await User.find();
            res.render('admin/user-manager', { title: 'Quản lý tài khoản', layout: 'layouts/admin', users });
        } catch (error) {
            res.status(500).send('Lỗi server.');
        }
    },

    // Thêm tài khoản
    addUser: async (req, res) => {
        try {
            // TODO: Kiểm tra quyền tài khoản
            let { name, email, status, avatar, role } = req.body;

            if (req.session.user.email != process.env.ROOT_USER) {
                return res.status(403).json({ error: 'Bạn không có quyền tạo tài khoản.' });
            }

            // 1. Validate dữ liệu
            if (!validateUser.validateName(name)) {
                return res.status(400).json({ error: 'Tên không hợp lệ.' });
            }
            if (!validateUser.validateEmail(email)) {
                return res.status(400).json({ error: 'Email không hợp lệ.' });
            }
            if (!validateUser.validateRole(role)) {
                return res.status(400).json({ error: 'Vai trò không hợp lệ.' });
            }
            if (!validateUser.validateStatus(status)) {
                return res.status(400).json({ error: 'Trạng thái không hợp lệ.' });
            }
            if (role != 'Admin' && role != 'User') {
                return res.status(400).json({ error: 'Vai trò không hợp lệ.' });
            }

            // Kiểm tra file avatar
            if (req.file && req.file) {
                avatar = '/uploads/' + req.file.filename;
                console.log(avatar);
            } else {
                avatar = '/img/icon/user.png';
            }

            // 2. Kiểm tra email đã tồn tại chưa
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(401).json({ error: 'Email đã tồn tại.' });
            }

            // 3. Tạo mật khẩu và hash
            const password = generatePassword(16);
            const hashedPassword = await hashPassword(password);

            // 4. Chuẩn hóa tên
            const formattedName = formatName(name);

            // 5. Lưu user mới
            const user = new User({
                name: formattedName,
                email,
                password: hashedPassword,
                role,
                status,
                avatar
            });
            await user.save();

            res.status(200).json({
                message: 'Tạo tài khoản thành công',
                userId: user.id, // ID tự tăng
            });

        } catch (err) {
            // 6. Bắt lỗi duplicate key từ MongoDB
            if (err.code === 11000 && err.keyValue?.email) {
                return res.status(400).json({ error: `Email ${err.keyValue.email} đã tồn tại.` });
            }

            // 7. Các lỗi khác
            console.error(err);
            res.status(500).json({ error: 'Có lỗi xảy ra khi tạo tài khoản.' });
        }
    },

    // Sửa tài khoản
    editUser: async (req, res) => {
        try {
            const { userId, name, status } = req.body;

            // Validate input nhanh gọn
            if (!userId) return res.status(400).json({ error: 'ID tài khoản không hợp lệ.' });

            // Validate dữ liệu
            if (!validateUser.validateName(name))
                return res.status(400).json({ error: 'Tên không hợp lệ.' });

            if (!validateUser.validateStatus(status))
                return res.status(400).json({ error: 'Trạng thái không hợp lệ.' });

            // Tìm và cập nhật tài khoản
            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ error: 'Tài khoản không tồn tại.' });

            // Không được phép tự khoá tài khoản của mình
            if (userId === req.session.user.id && status === 'Blocked') {
                return res.status(403).json({ error: 'Bạn không thể khoá tài khoản của mình.' });
            }

            // Kiểm tra quyền người dùng sửa tài khoản
            if (req.session.user.email != process.env.ROOT_USER && req.session.user.id != userId && user.role === 'Admin') {
                return res.status(403).json({ error: 'Bạn không có quyền sửa tài khoản.' });
            }

            // Xử lý avatar
            const avatar = req.file
                ? `/uploads/${req.file.filename}`
                : user.avatar;

            // Cập nhật DB
            Object.assign(user, { name, status, avatar });
            await user.save();

            // Cập nhật session
            await updateSession(userId, name, avatar);

            // Khoá tài khoản nếu cần
            if (status === 'Blocked') {
                await blockUser(userId);
            }

            return res.status(200).json({ message: 'Cập nhật tài khoản thành công' });

        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Có lỗi xảy ra khi cập nhật tài khoản.' });
        }
    },

    // Xóa tài khoản
    deleteUser: async (req, res) => {
        // TODO: Kiểm tra quyền tài khoản
        try {
            const { userId } = req.body;

            // Kiểm tra ID hợp lệ
            if (!userId) {
                return res.status(400).json({ error: 'ID tài khoản không hợp lệ.' });
            }

            // Kiểm tra quyền
            const user = await User.findOne({ _id: userId });

            if (!user) {
                return res.status(404).json({ error: 'Tài khoản không tồn tại.' });
            }

            if (user.role === 'Admin' && req.session.user.email != process.env.ROOT_USER || user.email === process.env.ROOT_USER) {
                return res.status(400).json({ error: 'Bạn không có quyền xóa tài khoản.' });
            }

            // Xóa tài khoản
            await User.deleteOne({ _id: userId });

            // Khóa tài khoản
            await blockUser(userId);

            res.status(200).json({ message: 'Xóa tài khoản thanh cong' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Có lỗi xảy ra khi xóa tài khoản.' });
        }
    },

    // Khóa tài khoản
    blockUser: async (req, res) => {
        try {
            // Lấy thông tin của request
            const { userId, isBlocked } = req.body;

            if (!userId) {
                return res.status(400).json({ error: 'ID tài khoản không hợp lệ.' });
            }

            // Kiểm tra quyền
            const user = await User.findOne({ _id: userId });

            if (!user) {
                return res.status(404).json({ error: 'Tài khoản không tồn tại.' });
            }

            if ((user.role === 'Admin' && req.session.user.email != process.env.ROOT_USER) || user.email === process.env.ROOT_USER) {
                return res.status(403).json({ error: 'Bạn không có quyền khóa tài khoản.' });
            }

            // Khóa tài khoản
            const userUpdated = await User.findOneAndUpdate(
                { _id: userId },
                { status: isBlocked ? 'Active' : 'Blocked' },
                { new: true }
            )

            if (!isBlocked) {
                // Khóa tài khoản
                await blockUser(userId);
            }

            return res.status(200).json({ message: 'Success' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Có lỗi xảy ra khi khoa tài khoản.' });
        }
    }
}