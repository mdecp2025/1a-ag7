import pygame
import sys
import random
import math
import json
import os
from datetime import datetime
from enum import Enum

# 初始化 Pygame
pygame.init()
pygame.font.init()

# 遊戲狀態
class GameState(Enum):
    MAIN_MENU = 0
    GAME_SELECTION = 1
    DIFFICULTY_SELECT = 2
    PLAYING = 3
    PAUSED = 4
    GAME_OVER = 5
    SURVIVAL_GAME = 6

# 難度設定
class Difficulty:
    EASY = {
        "name": "簡單",
        "birds": 15,
        "speed": 2,
        "spawn_min": 1000,
        "spawn_max": 2500,
        "has_bombs": False
    }
    
    NORMAL = {
        "name": "一般",
        "birds": 20,
        "speed": 2.3,
        "spawn_min": 800,
        "spawn_max": 2200,
        "has_bombs": True,
        "bomb_spawn_min": 4000,
        "bomb_spawn_max": 8000,
        "bomb_size": 60,
        "bomb_penalty": 10
    }
    
    HARD = {
        "name": "困難",
        "birds": 30,
        "speed": 2.8,
        "spawn_min": 600,
        "spawn_max": 1800,
        "has_bombs": True,
        "bomb_spawn_min": 1500,
        "bomb_spawn_max": 3500,
        "bomb_size": 60,
        "bomb_penalty": 10
    }
    
    RANDOM = {
        "name": "隨機",
        "birds": float('inf'),  # 無限生成飛鳥
        "time_limit": 40000,    # 40秒遊戲時間
        "speed": 2.5,
        "spawn_min": 1000,
        "spawn_max": 4500,
        "has_bombs": True,
        "bomb_spawn_min": 500,
        "bomb_spawn_max": 5000,
        "bomb_sizes": [20, 30, 40],
        "bomb_penalties": [5, 10, 20],
        "bomb_size": "custom"
    }

class BirdShootingGame:
    def __init__(self):
        # 視窗設定
        self.screen_width = 1280
        self.screen_height = 720
        self.screen = pygame.display.set_mode((self.screen_width, self.screen_height))
        pygame.display.set_caption("永恆領域遊戲")
        
        # 遊戲狀態
        self.current_state = GameState.MAIN_MENU
        self.current_difficulty = Difficulty.EASY
        self.current_game_id = 'birdShooting'
        
        # 遊戲變數
        self.score = 0
        self.birds = []
        self.bombs = []
        self.birds_spawned = 0
        self.birds_killed = 0
        self.birds_escaped = 0
        self.last_spawn_time = 0
        self.last_bomb_spawn_time = 0
        self.bomb_spawn_interval = 0
        self.is_random_mode = False
        self.game_start_time = 0
        self.game_timer = 0
        
        # 顏色定義
        self.colors = {
            'background': (26, 26, 46),
            'background2': (22, 33, 62),
            'background3': (15, 52, 96),
            'accent': (76, 201, 240),
            'text': (255, 255, 255),
            'bird_colors': [
                (255, 107, 107),   # 紅色
                (78, 205, 196),    # 青色
                (255, 230, 109),   # 黃色
                (106, 5, 114),     # 紫色
                (26, 147, 111),    # 綠色
                (17, 75, 95),      # 深藍
                (249, 200, 14),    # 金黃
                (234, 53, 70)      # 深紅
            ],
            'bomb': (255, 153, 0),
            'bomb_inner': (255, 204, 102)
        }
        
        # 載入字體
        self.title_font = pygame.font.SysFont('microsoftjhengheimicrosoftjhengheiuibold', 72)
        self.subtitle_font = pygame.font.SysFont('microsoftjhengheimicrosoftjhengheiuibold', 36)
        self.button_font = pygame.font.SysFont('microsoftjhengheimicrosoftjhengheiuibold', 32)
        self.hud_font = pygame.font.SysFont('microsoftjhengheimicrosoftjhengheiuibold', 24)
        
        # 準星
        self.crosshair_size = 40
        self.crosshair_thickness = 2
        
        # 遊戲歷史
        self.game_history = []
        self.load_history()
        
        # 按鈕定義
        self.buttons = {}
        self.create_buttons()
        
        # 初始化遊戲物件
        self.init_game_objects()
        
    def create_buttons(self):
        """創建遊戲按鈕"""
        # 主畫面按鈕
        button_width = 250
        button_height = 60
        
        self.buttons['start'] = {
            'rect': pygame.Rect(
                self.screen_width // 2 - button_width // 2,
                self.screen_height // 2 + 50,
                button_width,
                button_height
            ),
            'text': '開始遊戲',
            'color': (30, 60, 114, 178),
            'hover_color': (40, 80, 150, 204)
        }
        
        # 難度選擇按鈕
        difficulties = ['簡單', '一般', '困難', '隨機難度', '退出', '繼續']
        for i, text in enumerate(difficulties):
            self.buttons[f'diff_{i}'] = {
                'rect': pygame.Rect(
                    self.screen_width // 2 - button_width // 2,
                    200 + i * 70,
                    button_width,
                    button_height
                ),
                'text': text,
                'color': (30, 60, 114, 178),
                'hover_color': (40, 80, 150, 204)
            }
        
        # 歷史記錄按鈕
        self.buttons['history'] = {
            'rect': pygame.Rect(
                self.screen_width - 150,
                self.screen_height - 70,
                130,
                50
            ),
            'text': '歷史記錄',
            'color': (30, 60, 114, 178),
            'hover_color': (40, 80, 150, 204)
        }
        
        # 繼續按鈕（遊戲結束）
        self.buttons['continue'] = {
            'rect': pygame.Rect(
                self.screen_width // 2 - 100,
                self.screen_height // 2 + 50,
                200,
                50
            ),
            'text': '繼續',
            'color': (30, 60, 114, 178),
            'hover_color': (40, 80, 150, 204)
        }
    
    def init_game_objects(self):
        """初始化遊戲物件"""
        pass
    
    def load_history(self):
        """載入遊戲歷史記錄"""
        try:
            if os.path.exists('game_history.json'):
                with open('game_history.json', 'r', encoding='utf-8') as f:
                    self.game_history = json.load(f)
        except:
            self.game_history = []
    
    def save_history(self):
        """儲存遊戲歷史記錄"""
        try:
            with open('game_history.json', 'w', encoding='utf-8') as f:
                json.dump(self.game_history, f, ensure_ascii=False, indent=2)
        except:
            pass
    
    def add_history_record(self, score, difficulty_name, game_name):
        """添加歷史記錄"""
        now = datetime.now()
        date_str = now.strftime("%Y/%m/%d %H:%M")
        
        record = {
            'date': date_str,
            'score': score,
            'difficulty': difficulty_name,
            'game': game_name
        }
        
        self.game_history.insert(0, record)
        if len(self.game_history) > 50:
            self.game_history = self.game_history[:50]
        
        self.save_history()
    
    def draw_background(self):
        """繪製背景"""
        # 漸層背景
        for i in range(self.screen_height):
            ratio = i / self.screen_height
            r = int(26 + (22 - 26) * ratio)
            g = int(26 + (33 - 26) * ratio)
            b = int(46 + (62 - 46) * ratio)
            pygame.draw.line(self.screen, (r, g, b), (0, i), (self.screen_width, i))
    
    def draw_button(self, button_key):
        """繪製按鈕"""
        if button_key not in self.buttons:
            return
        
        button = self.buttons[button_key]
        mouse_pos = pygame.mouse.get_pos()
        
        # 檢查滑鼠是否在按鈕上
        is_hover = button['rect'].collidepoint(mouse_pos)
        
        # 按鈕顏色
        color = button['hover_color'] if is_hover else button['color']
        
        # 繪製按鈕背景
        pygame.draw.rect(self.screen, color, button['rect'], border_radius=10)
        
        # 按鈕邊框
        pygame.draw.rect(self.screen, self.colors['accent'], button['rect'], 2, border_radius=10)
        
        # 按鈕文字
        text_surface = self.button_font.render(button['text'], True, self.colors['text'])
        text_rect = text_surface.get_rect(center=button['rect'].center)
        self.screen.blit(text_surface, text_rect)
        
        return is_hover
    
    def draw_main_menu(self):
        """繪製主選單"""
        # 繪製背景
        self.draw_background()
        
        # 標題
        title = self.title_font.render("永恆領域遊戲", True, self.colors['text'])
        title_rect = title.get_rect(center=(self.screen_width // 2, 200))
        self.screen.blit(title, title_rect)
        
        # 副標題
        subtitle = self.subtitle_font.render("按空格鍵或點擊開始按鈕開始遊戲", True, (160, 160, 160))
        subtitle_rect = subtitle.get_rect(center=(self.screen_width // 2, 280))
        self.screen.blit(subtitle, subtitle_rect)
        
        # 開始按鈕
        self.draw_button('start')
    
    def draw_difficulty_selection(self):
        """繪製難度選擇畫面"""
        # 繪製背景
        self.draw_background()
        
        # 標題
        title = self.title_font.render("選擇難度", True, self.colors['text'])
        title_rect = title.get_rect(center=(self.screen_width // 2, 100))
        self.screen.blit(title, title_rect)
        
        # 繪製難度按鈕
        for i in range(6):
            button_key = f'diff_{i}'
            if button_key in self.buttons:
                self.draw_button(button_key)
        
        # 歷史記錄按鈕
        self.draw_button('history')
        
        # 提示文字
        hint = self.subtitle_font.render("按ESC鍵暫停遊戲", True, (160, 160, 160))
        hint_rect = hint.get_rect(center=(self.screen_width // 2, self.screen_height - 50))
        self.screen.blit(hint, hint_rect)
    
    def draw_game_screen(self):
        """繪製遊戲畫面"""
        # 繪製背景
        self.draw_background()
        
        # 繪製飛鳥
        for bird in self.birds:
            self.draw_bird(bird)
        
        # 繪製炸彈
        for bomb in self.bombs:
            self.draw_bomb(bomb)
        
        # 繪製HUD
        self.draw_hud()
        
        # 繪製準星
        self.draw_crosshair()
    
    def draw_bird(self, bird):
        """繪製飛鳥"""
        # 飛鳥身體（橢圓）
        pygame.draw.ellipse(self.screen, bird['color'], 
                           (bird['x'] - bird['width']/2, bird['y'] - bird['height']/2,
                            bird['width'], bird['height']))
        
        # 翅膀
        wing_color = (255, 255, 255, 77)  # RGBA 白色半透明
        wing_surface = pygame.Surface((bird['width']*0.67, bird['height']*1.5), pygame.SRCALPHA)
        pygame.draw.ellipse(wing_surface, wing_color, (0, 0, bird['width']*0.67, bird['height']*1.5))
        
        wing_x = bird['x'] - (10 if bird['speed'] > 0 else -10) - bird['width']/3
        wing_y = bird['y'] - 5 - bird['height']/1.5/2
        self.screen.blit(wing_surface, (wing_x, wing_y))
        
        # 眼睛
        pygame.draw.circle(self.screen, (255, 255, 255), 
                          (int(bird['x'] + (bird['width']/4 if bird['speed'] > 0 else -bird['width']/4)), 
                           int(bird['y'] - 5)), 5)
        pygame.draw.circle(self.screen, (0, 0, 0), 
                          (int(bird['x'] + (bird['width']/4 if bird['speed'] > 0 else -bird['width']/4)), 
                           int(bird['y'] - 5)), 2)
    
    def draw_bomb(self, bomb):
        """繪製炸彈"""
        # 炸彈主體
        pygame.draw.ellipse(self.screen, self.colors['bomb'],
                           (bomb['x'] - bomb['width']/2, bomb['y'] - bomb['height']/2,
                            bomb['width'], bomb['height']))
        
        # 內圈
        pygame.draw.ellipse(self.screen, self.colors['bomb_inner'],
                           (bomb['x'] - bomb['width']/3, bomb['y'] - bomb['height']/3,
                            bomb['width']*2/3, bomb['height']*2/3))
        
        # 引信
        fuse_height = bomb['width'] * 0.25
        pygame.draw.rect(self.screen, (139, 69, 19),  # 棕色
                        (bomb['x'] - bomb['width']/20, bomb['y'] - bomb['height']/2 - fuse_height,
                         bomb['width']/10, fuse_height))
        
        # 火花
        pygame.draw.ellipse(self.screen, (255, 69, 0),
                           (bomb['x'] - bomb['width']/10, bomb['y'] - bomb['height']/2 - fuse_height - bomb['width']/8,
                            bomb['width']/5, bomb['width']/4))
        
        # 危險標誌
        font = pygame.font.SysFont('arial', int(bomb['width']/3), bold=True)
        text = font.render('!', True, (255, 255, 255))
        text_rect = text.get_rect(center=(bomb['x'], bomb['y']))
        self.screen.blit(text, text_rect)
    
    def draw_hud(self):
        """繪製遊戲HUD"""
        # 分數
        score_text = self.hud_font.render(f"分數: {self.score}", True, self.colors['text'])
        self.screen.blit(score_text, (20, 20))
        
        # 剩餘飛鳥（非隨機模式）
        if not self.is_random_mode:
            birds_left = self.current_difficulty['birds'] - self.birds_killed - self.birds_escaped
            birds_text = self.hud_font.render(f"剩餘飛鳥: {birds_left}", True, self.colors['text'])
            self.screen.blit(birds_text, (self.screen_width - 200, 20))
        
        # 剩餘時間（隨機模式）
        if self.is_random_mode:
            elapsed = pygame.time.get_ticks() - self.game_start_time
            time_left = max(0, self.current_difficulty['time_limit'] - elapsed)
            seconds_left = math.ceil(time_left / 1000)
            time_text = self.hud_font.render(f"剩餘時間: {seconds_left}秒", True, self.colors['accent'])
            self.screen.blit(time_text, (self.screen_width - 200, 60))
    
    def draw_crosshair(self):
        """繪製準星"""
        mouse_x, mouse_y = pygame.mouse.get_pos()
        
        # 外圈
        pygame.draw.circle(self.screen, self.colors['accent'], (mouse_x, mouse_y), 
                          self.crosshair_size // 2, self.crosshair_thickness)
        
        # 十字線
        pygame.draw.line(self.screen, self.colors['accent'],
                        (mouse_x, mouse_y - 10), (mouse_x, mouse_y + 10), self.crosshair_thickness)
        pygame.draw.line(self.screen, self.colors['accent'],
                        (mouse_x - 10, mouse_y), (mouse_x + 10, mouse_y), self.crosshair_thickness)
    
    def draw_game_over(self):
        """繪製遊戲結束畫面"""
        # 半透明背景
        overlay = pygame.Surface((self.screen_width, self.screen_height), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 200))
        self.screen.blit(overlay, (0, 0))
        
        # 遊戲結束文字
        game_over = self.title_font.render("遊戲結束", True, self.colors['accent'])
        game_over_rect = game_over.get_rect(center=(self.screen_width // 2, self.screen_height // 2 - 100))
        self.screen.blit(game_over, game_over_rect)
        
        # 分數
        score_text = self.subtitle_font.render(f"你的分數: {self.score}", True, self.colors['text'])
        score_rect = score_text.get_rect(center=(self.screen_width // 2, self.screen_height // 2))
        self.screen.blit(score_text, score_rect)
        
        # 繼續按鈕
        self.draw_button('continue')
    
    def create_bird(self):
        """創建一隻飛鳥"""
        from_left = random.random() > 0.5
        x = -50 if from_left else self.screen_width + 50
        y = random.randint(50, self.screen_height - 50)
        
        bird = {
            'x': x,
            'y': y,
            'width': 60,
            'height': 30,
            'speed': self.current_difficulty['speed'] * (1 if from_left else -1),
            'color': random.choice(self.colors['bird_colors']),
            'from_left': from_left
        }
        
        self.birds.append(bird)
        self.birds_spawned += 1
    
    def create_bomb(self):
        """創建一個炸彈"""
        from_left = random.random() > 0.5
        x = -50 if from_left else self.screen_width + 50
        y = random.randint(50, self.screen_height - 50)
        
        if self.current_difficulty['name'] == "隨機":
            size_index = random.randint(0, 2)
            width = self.current_difficulty['bomb_sizes'][size_index]
            height = self.current_difficulty['bomb_sizes'][size_index]
            penalty = self.current_difficulty['bomb_penalties'][size_index]
            bomb_size = "small" if width == 20 else "medium" if width == 30 else "large"
        else:
            bomb_size = "medium"
            width = self.current_difficulty['bomb_size']
            height = self.current_difficulty['bomb_size']
            penalty = self.current_difficulty['bomb_penalty']
        
        bomb = {
            'x': x,
            'y': y,
            'width': width,
            'height': height,
            'size': bomb_size,
            'speed': self.current_difficulty['speed'] * (1 if from_left else -1),
            'penalty': penalty,
            'from_left': from_left,
            'rotation': 0,
            'rotation_speed': random.uniform(2, 6) * (1 if random.random() > 0.5 else -1)
        }
        
        self.bombs.append(bomb)
        
        # 設置下一次生成時間
        self.bomb_spawn_interval = random.randint(
            self.current_difficulty['bomb_spawn_min'],
            self.current_difficulty['bomb_spawn_max']
        )
    
    def update_birds(self):
        """更新飛鳥位置"""
        for bird in self.birds[:]:
            bird['x'] += bird['speed']
            
            # 檢查是否飛出畫面
            if ((bird['from_left'] and bird['x'] > self.screen_width + bird['width']/2) or
                (not bird['from_left'] and bird['x'] < -bird['width']/2)):
                self.birds.remove(bird)
                self.birds_escaped += 1
    
    def update_bombs(self):
        """更新炸彈位置"""
        for bomb in self.bombs[:]:
            bomb['x'] += bomb['speed']
            bomb['rotation'] += bomb['rotation_speed'] * 0.05
            
            # 檢查是否飛出畫面
            if ((bomb['from_left'] and bomb['x'] > self.screen_width + bomb['width']/2) or
                (not bomb['from_left'] and bomb['x'] < -bomb['width']/2)):
                self.bombs.remove(bomb)
    
    def check_click(self, mouse_pos):
        """檢查點擊事件"""
        mouse_x, mouse_y = mouse_pos
        click_radius = 30
        
        # 先檢查炸彈
        for bomb in self.bombs[:]:
            distance = math.sqrt((mouse_x - bomb['x'])**2 + (mouse_y - bomb['y'])**2)
            if distance < bomb['width']/2 + 10:
                self.bombs.remove(bomb)
                self.score = max(0, self.score - bomb['penalty'])
                return True
        
        # 檢查飛鳥
        for bird in self.birds[:]:
            distance = math.sqrt((mouse_x - bird['x'])**2 + (mouse_y - bird['y'])**2)
            if distance < click_radius:
                self.birds.remove(bird)
                self.birds_killed += 1
                self.score += 10
                return True
        
        return False
    
    def start_game(self, difficulty):
        """開始遊戲"""
        self.current_difficulty = difficulty
        self.current_state = GameState.PLAYING
        
        # 重置遊戲變數
        self.score = 0
        self.birds = []
        self.bombs = []
        self.birds_spawned = 0
        self.birds_killed = 0
        self.birds_escaped = 0
        self.last_spawn_time = pygame.time.get_ticks()
        self.last_bomb_spawn_time = pygame.time.get_ticks()
        self.bomb_spawn_interval = 0
        
        # 檢查是否為隨機模式
        self.is_random_mode = difficulty['name'] == "隨機"
        
        if self.is_random_mode:
            self.game_start_time = pygame.time.get_ticks()
    
    def check_game_over(self):
        """檢查遊戲是否結束"""
        if self.is_random_mode:
            # 隨機模式：檢查時間
            elapsed = pygame.time.get_ticks() - self.game_start_time
            return elapsed >= self.current_difficulty['time_limit']
        else:
            # 其他模式：檢查是否所有飛鳥都已處理
            birds_left = self.current_difficulty['birds'] - self.birds_killed - self.birds_escaped
            return birds_left <= 0 and len(self.birds) == 0
    
    def handle_events(self):
        """處理事件"""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return False
            
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    if self.current_state == GameState.PLAYING:
                        self.current_state = GameState.PAUSED
                    elif self.current_state == GameState.PAUSED:
                        self.current_state = GameState.PLAYING
                
                elif event.key == pygame.K_SPACE:
                    if self.current_state == GameState.MAIN_MENU:
                        self.current_state = GameState.DIFFICULTY_SELECT
            
            elif event.type == pygame.MOUSEBUTTONDOWN:
                if event.button == 1:  # 左鍵點擊
                    mouse_pos = pygame.mouse.get_pos()
                    
                    if self.current_state == GameState.MAIN_MENU:
                        if self.buttons['start']['rect'].collidepoint(mouse_pos):
                            self.current_state = GameState.DIFFICULTY_SELECT
                    
                    elif self.current_state == GameState.DIFFICULTY_SELECT:
                        # 難度選擇按鈕
                        for i in range(6):
                            button_key = f'diff_{i}'
                            if (button_key in self.buttons and 
                                self.buttons[button_key]['rect'].collidepoint(mouse_pos)):
                                
                                if i == 0:  # 簡單
                                    self.start_game(Difficulty.EASY)
                                elif i == 1:  # 一般
                                    self.start_game(Difficulty.NORMAL)
                                elif i == 2:  # 困難
                                    self.start_game(Difficulty.HARD)
                                elif i == 3:  # 隨機難度
                                    self.start_game(Difficulty.RANDOM)
                                elif i == 4:  # 退出
                                    self.current_state = GameState.MAIN_MENU
                                elif i == 5:  # 繼續
                                    self.current_state = GameState.PLAYING
                        
                        # 歷史記錄按鈕
                        if self.buttons['history']['rect'].collidepoint(mouse_pos):
                            # TODO: 顯示歷史記錄
                            pass
                    
                    elif self.current_state == GameState.PLAYING:
                        self.check_click(mouse_pos)
                    
                    elif self.current_state == GameState.GAME_OVER:
                        if self.buttons['continue']['rect'].collidepoint(mouse_pos):
                            self.current_state = GameState.DIFFICULTY_SELECT
        
        return True
    
    def update_game(self):
        """更新遊戲邏輯"""
        if self.current_state != GameState.PLAYING:
            return
        
        current_time = pygame.time.get_ticks()
        
        # 生成飛鳥
        if self.is_random_mode:
            # 隨機模式：1~4.5秒隨機生成
            if current_time - self.last_spawn_time > random.randint(1000, 4500):
                self.create_bird()
                self.last_spawn_time = current_time
        else:
            # 其他模式
            if (self.birds_spawned < self.current_difficulty['birds'] and
                current_time - self.last_spawn_time > random.randint(
                    self.current_difficulty['spawn_min'],
                    self.current_difficulty['spawn_max']
                )):
                self.create_bird()
                self.last_spawn_time = current_time
        
        # 生成炸彈
        if self.current_difficulty['has_bombs']:
            if current_time - self.last_bomb_spawn_time > self.bomb_spawn_interval:
                self.create_bomb()
                self.last_bomb_spawn_time = current_time
        
        # 更新物件位置
        self.update_birds()
        self.update_bombs()
        
        # 檢查遊戲是否結束
        if self.check_game_over():
            self.end_game()
    
    def end_game(self):
        """結束遊戲"""
        self.current_state = GameState.GAME_OVER
        game_name = "飛鳥射擊遊戲" if self.current_game_id == 'birdShooting' else "未知遊戲"
        self.add_history_record(self.score, self.current_difficulty['name'], game_name)
    
    def run(self):
        """執行遊戲主循環"""
        clock = pygame.time.Clock()
        running = True
        
        while running:
            # 處理事件
            running = self.handle_events()
            
            # 更新遊戲邏輯
            self.update_game()
            
            # 繪製畫面
            if self.current_state == GameState.MAIN_MENU:
                self.draw_main_menu()
            elif self.current_state == GameState.DIFFICULTY_SELECT:
                self.draw_difficulty_selection()
            elif self.current_state == GameState.PLAYING:
                self.draw_game_screen()
            elif self.current_state == GameState.GAME_OVER:
                self.draw_game_screen()  # 先繪製遊戲畫面
                self.draw_game_over()    # 再繪製遊戲結束畫面
            
            pygame.display.flip()
            clock.tick(60)  # 60 FPS
        
        pygame.quit()
        sys.exit()

if __name__ == "__main__":
    game = BirdShootingGame()
    game.run()